"""
FAHIN — Anomaly Detection Service
Uses Autoencoder reconstruction error and Isolation Forest to detect unknown diseases.
"""
import torch
import torch.nn as nn
import logging
import json
import joblib
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)

class SymptomAutoencoder(nn.Module):
    def __init__(self, input_dim: int = 768):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 16),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(16, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, input_dim),
            nn.Sigmoid(),
        )
    
    def forward(self, x: torch.Tensor) -> tuple:
        z = self.encoder(x)
        x_reconstructed = self.decoder(z)
        return x_reconstructed, z

class AnomalyDetectorService:
    def __init__(self, model_path: Path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        with open(model_path / "metadata.json") as f:
            self.metadata = json.load(f)
            
        # 1. Autoencoder
        self.ae = SymptomAutoencoder(input_dim=self.metadata["input_dim"])
        state_dict = torch.load(model_path / "autoencoder.pt", map_location=self.device)
        self.ae.load_state_dict(state_dict)
        self.ae.to(self.device).eval()
        self.ae_threshold = self.metadata["autoencoder"]["anomaly_threshold"]
        
        # 2. Isolation Forest (as ensemble backup)
        self.iso_forest = joblib.load(model_path / "isolation_forest.pkl")
        self.iso_scaler = joblib.load(model_path / "iso_scaler.pkl")
        
        logger.info(f"Anomaly Detector loaded on {self.device}")

    def compute_anomaly_score(self, embedding: list[float]) -> dict:
        """
        Computes anomaly score (0.0 to 1.0).
        Score > 0.7 indicates a potentially unknown disease pattern.
        """
        x = torch.tensor([embedding], dtype=torch.float32).to(self.device)
        
        # 1. Autoencoder Score
        with torch.no_grad():
            x_rec, _ = self.ae(x)
            mse = ((x - x_rec) ** 2).mean().item()
        
        # Normalise AE score relative to threshold (0.5 = at threshold)
        ae_norm = min(1.0, mse / (self.ae_threshold * 2))
        
        # 2. Isolation Forest Score
        x_scaled = self.iso_scaler.transform([embedding])
        # score_samples returns negative: more negative = more anomalous
        iso_raw = self.iso_forest.score_samples(x_scaled)[0]
        # Typically iso_raw is between -0.8 (anomaly) and -0.4 (normal)
        iso_norm = np.clip((-(iso_raw + 0.4) / 0.4), 0, 1)
        
        # Combined score (weighted)
        combined = ae_norm * 0.7 + iso_norm * 0.3
        
        return {
            "anomaly_score": float(combined),
            "is_anomaly": combined > 0.7,
            "reconstruction_error": mse,
            "threshold": self.ae_threshold
        }
