"""
FAHIN — Anomaly Detection Model Training
Architecture: Deep Autoencoder (PyTorch) + Isolation Forest (scikit-learn)
Input: 768-dim symptom cluster embedding (from Symptom Embedding Model)
Output: Anomaly score (reconstruction error)
Purpose: Detect UNKNOWN diseases — symptom clusters that don't match known patterns
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path
import argparse
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Autoencoder Architecture ──────────────────────────────────────────────────

class SymptomAutoencoder(nn.Module):
    """
    Deep autoencoder for anomaly detection.
    Learns to reconstruct "normal" symptom embeddings.
    High reconstruction error = unusual/unknown disease pattern.
    
    Input/Output: 768-dim symptom embedding
    Bottleneck: 16-dim (forces compression to essential features)
    """
    
    def __init__(self, input_dim: int = 768):
        super().__init__()
        
        # Encoder: 768 → 256 → 64 → 16
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
        
        # Decoder: 16 → 64 → 256 → 768
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
            nn.Sigmoid(),  # Embeddings are normalised to [0,1]
        )
    
    def forward(self, x: torch.Tensor) -> tuple:
        z = self.encoder(x)
        x_reconstructed = self.decoder(z)
        return x_reconstructed, z
    
    def reconstruction_error(self, x: torch.Tensor) -> torch.Tensor:
        """Compute per-sample MSE reconstruction error (the anomaly score)."""
        x_rec, _ = self(x)
        return ((x - x_rec) ** 2).mean(dim=1)


# ── Dataset ───────────────────────────────────────────────────────────────────

class EmbeddingDataset(Dataset):
    def __init__(self, embeddings: np.ndarray):
        self.embeddings = torch.tensor(embeddings, dtype=torch.float32)
    
    def __len__(self):
        return len(self.embeddings)
    
    def __getitem__(self, idx):
        return self.embeddings[idx]


# ── Synthetic Data Generation (for demo / testing) ───────────────────────────

def generate_synthetic_normal_embeddings(n_samples: int = 10000, dim: int = 768) -> np.ndarray:
    """
    Generate synthetic 'normal' symptom cluster embeddings for training.
    In production, replace with real embeddings from historical data.
    
    Normal embeddings cluster around a few disease centers.
    """
    logger.info(f"Generating {n_samples} synthetic normal embeddings (dim={dim})")
    
    # 41 disease cluster centres
    n_diseases = 41
    disease_centers = np.random.randn(n_diseases, dim) * 0.3
    
    embeddings = []
    for _ in range(n_samples):
        # Sample from a random disease cluster
        disease_idx = np.random.randint(0, n_diseases)
        center = disease_centers[disease_idx]
        # Add small gaussian noise (intra-disease variation)
        embedding = center + np.random.randn(dim) * 0.05
        embeddings.append(embedding)
    
    return np.clip(np.array(embeddings), 0, 1)


# ── Training ──────────────────────────────────────────────────────────────────

def train_autoencoder(
    embeddings: np.ndarray,
    output_dir: Path,
    epochs: int = 100,
    batch_size: int = 256,
    lr: float = 1e-3,
    threshold_sigma: float = 3.0,
) -> dict:
    """Train the autoencoder on normal embeddings."""
    
    train_split = int(len(embeddings) * 0.9)
    train_data = embeddings[:train_split]
    val_data = embeddings[train_split:]
    
    train_dataset = EmbeddingDataset(train_data)
    val_dataset = EmbeddingDataset(val_data)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = SymptomAutoencoder(input_dim=embeddings.shape[1]).to(DEVICE)
    optimiser = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-5)
    criterion = nn.MSELoss()
    
    logger.info(f"Autoencoder parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    best_val_loss = float("inf")
    
    for epoch in range(epochs):
        # Train
        model.train()
        train_losses = []
        for batch in train_loader:
            batch = batch.to(DEVICE)
            optimiser.zero_grad()
            x_rec, _ = model(batch)
            loss = criterion(x_rec, batch)
            loss.backward()
            optimiser.step()
            train_losses.append(loss.item())
        
        # Validate
        model.eval()
        val_losses = []
        with torch.no_grad():
            for batch in val_loader:
                batch = batch.to(DEVICE)
                x_rec, _ = model(batch)
                loss = criterion(x_rec, batch)
                val_losses.append(loss.item())
        
        train_loss = np.mean(train_losses)
        val_loss = np.mean(val_losses)
        
        if (epoch + 1) % 20 == 0:
            logger.info(f"Epoch {epoch+1}/{epochs} | Train: {train_loss:.6f} | Val: {val_loss:.6f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), output_dir / "autoencoder_best.pt")
    
    torch.save(model.state_dict(), output_dir / "autoencoder.pt")
    
    # Compute anomaly threshold from training data reconstruction errors
    model.eval()
    all_errors = []
    with torch.no_grad():
        for batch in DataLoader(EmbeddingDataset(embeddings), batch_size=512):
            batch = batch.to(DEVICE)
            errors = model.reconstruction_error(batch)
            all_errors.extend(errors.cpu().numpy())
    
    all_errors = np.array(all_errors)
    threshold = all_errors.mean() + threshold_sigma * all_errors.std()
    
    logger.info(f"Anomaly threshold (mean + {threshold_sigma}σ): {threshold:.6f}")
    logger.info(f"Error distribution: mean={all_errors.mean():.6f}, std={all_errors.std():.6f}")
    
    return {
        "best_val_loss": float(best_val_loss),
        "anomaly_threshold": float(threshold),
        "error_mean": float(all_errors.mean()),
        "error_std": float(all_errors.std()),
    }


def train_isolation_forest(embeddings: np.ndarray, output_dir: Path) -> dict:
    """Train Isolation Forest as backup anomaly detector."""
    logger.info("Training Isolation Forest...")
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(embeddings)
    
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.05,  # Assume 5% of training data might be edge cases
        random_state=42,
        n_jobs=-1,
    )
    iso_forest.fit(X_scaled)
    
    joblib.dump(iso_forest, output_dir / "isolation_forest.pkl")
    joblib.dump(scaler, output_dir / "iso_scaler.pkl")
    
    # Sanity check: anomaly scores on training data
    scores = iso_forest.score_samples(X_scaled)
    logger.info(f"Isolation Forest score distribution: mean={scores.mean():.3f}, std={scores.std():.3f}")
    
    return {"contamination": 0.05, "n_estimators": 200}


def train(
    normal_data_path: str,
    output_dir: str,
    epochs: int = 100,
    threshold_sigma: float = 3.0,
):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load or generate embeddings
    if normal_data_path and Path(normal_data_path).exists():
        logger.info(f"Loading embeddings from {normal_data_path}")
        embeddings = np.load(normal_data_path)
    else:
        logger.warning("No embedding file found. Generating synthetic data for demo.")
        embeddings = generate_synthetic_normal_embeddings(n_samples=10000, dim=768)
        np.save(output_path / "synthetic_embeddings.npy", embeddings)
    
    logger.info(f"Embedding shape: {embeddings.shape}")
    
    # Train both detectors
    ae_metrics = train_autoencoder(embeddings, output_path, epochs=epochs, threshold_sigma=threshold_sigma)
    iso_metrics = train_isolation_forest(embeddings, output_path)
    
    # Save combined metadata
    metadata = {
        "input_dim": embeddings.shape[1],
        "n_training_samples": len(embeddings),
        "threshold_sigma": threshold_sigma,
        "autoencoder": ae_metrics,
        "isolation_forest": iso_metrics,
    }
    with open(output_path / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Anomaly Detection models saved to {output_path}")
    logger.info(f"Anomaly threshold: {ae_metrics['anomaly_threshold']:.6f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train FAHIN Anomaly Detection Model")
    parser.add_argument("--normal_data", default="", help="Path to .npy file of normal embeddings")
    parser.add_argument("--output", default="ml/models/anomaly_detection/", help="Output directory")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--threshold_sigma", type=float, default=3.0)
    args = parser.parse_args()
    
    train(args.normal_data, args.output, epochs=args.epochs, threshold_sigma=args.threshold_sigma)
