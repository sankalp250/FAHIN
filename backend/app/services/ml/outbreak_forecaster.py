"""
FAHIN — Outbreak Forecast Service
Wraps the LSTM model for case count prediction.
"""
import torch
import torch.nn as nn
import logging
import json
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)

class OutbreakLSTM(nn.Module):
    def __init__(
        self,
        n_features: int = 3,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2,
        forecast_horizon: int = 7,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, forecast_horizon),
            nn.ReLU(),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        return self.fc(last_hidden)

class OutbreakForecasterService:
    def __init__(self, model_path: Path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        with open(model_path / "metadata.json") as f:
            self.metadata = json.load(f)
            
        self.model = OutbreakLSTM(
            n_features=self.metadata["n_features"],
            hidden_size=self.metadata["hidden_size"],
            num_layers=self.metadata["num_layers"],
            forecast_horizon=self.metadata["forecast_horizon"]
        )
        
        state_dict = torch.load(model_path / "lstm.pt", map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        
        self.mins = np.array(self.metadata["normalisation_mins"])
        self.maxs = np.array(self.metadata["normalisation_maxs"])
        logger.info(f"Outbreak Forecaster loaded on {self.device}")

    def predict(self, history_data: list[list[float]]) -> list[float]:
        """
        Predict case counts for the next 7 days.
        Input: list of 30 days of features [symptom_count, pharmacy_sales, hospital_admissions]
        """
        # History data should be (30, 3)
        data = np.array(history_data)
        
        # Normalise using metadata from training
        data_scaled = (data - self.mins) / (self.maxs - self.mins + 1e-8)
        
        x = torch.tensor(data_scaled, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            pred = self.model(x)
        
        # Denormalise the first feature (case counts)
        # Note: In training y = data[..., 0], so we denormalise using mins[0] and maxs[0]
        pred_scaled = pred.squeeze(0).cpu().numpy()
        pred_final = pred_scaled * (self.maxs[0] - self.mins[0] + 1e-8) + self.mins[0]
        
        return pred_final.tolist()
