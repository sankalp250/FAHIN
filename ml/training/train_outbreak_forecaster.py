"""
FAHIN — Outbreak Forecast Model Training
Architecture: LSTM with 2 layers
Input: 30-day rolling window of (symptom_count, pharmacy_sales, hospital_admissions)
Output: 7-day ahead case count forecast
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from pathlib import Path
import argparse
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Model Architecture ────────────────────────────────────────────────────────

class OutbreakLSTM(nn.Module):
    """
    LSTM-based time series forecaster for outbreak prediction.
    
    Input shape:  (batch, seq_len=30, n_features=3)
    Output shape: (batch, forecast_horizon=7)
    """
    
    def __init__(
        self,
        n_features: int = 3,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2,
        forecast_horizon: int = 7,
    ):
        super().__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
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
            nn.ReLU(),  # Case counts cannot be negative
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, n_features)
        lstm_out, _ = self.lstm(x)
        # Use last time step output
        last_hidden = lstm_out[:, -1, :]  # (batch, hidden_size)
        return self.fc(last_hidden)       # (batch, forecast_horizon)


# ── Dataset ───────────────────────────────────────────────────────────────────

class OutbreakDataset(Dataset):
    """Sliding window dataset for time series."""
    
    def __init__(
        self,
        data: np.ndarray,
        seq_len: int = 30,
        forecast_horizon: int = 7,
    ):
        self.data = data
        self.seq_len = seq_len
        self.forecast_horizon = forecast_horizon
        
        self.n_samples = len(data) - seq_len - forecast_horizon + 1
        assert self.n_samples > 0, "Not enough data for the given seq_len + forecast_horizon"
    
    def __len__(self):
        return self.n_samples
    
    def __getitem__(self, idx):
        x = self.data[idx : idx + self.seq_len]             # (seq_len, n_features)
        # Target is the first feature (symptom count) for next 7 days
        y = self.data[idx + self.seq_len : idx + self.seq_len + self.forecast_horizon, 0]
        return (
            torch.tensor(x, dtype=torch.float32),
            torch.tensor(y, dtype=torch.float32),
        )


# ── Data Loading ──────────────────────────────────────────────────────────────

def load_cdc_flu_data(csv_path: str) -> np.ndarray:
    """
    Load and prepare CDC FluView weekly data.
    Columns used: TOTAL ILI, NUM PROVIDERS, ILITOTAL
    """
    df = pd.read_csv(csv_path, skiprows=1)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    
    # Sort by year/week
    df = df.sort_values(["year", "week"]).reset_index(drop=True)
    
    # Extract features: ILI count, number of providers reporting, % positive tests
    features = []
    for col in ["ilitotal", "num_providers", "total_patients"]:
        if col in df.columns:
            series = df[col].fillna(0).values.astype(float)
            features.append(series)
        else:
            features.append(np.zeros(len(df)))
    
    data = np.stack(features, axis=1)  # (T, 3)
    
    # Normalise each feature to [0, 1]
    mins = data.min(axis=0)
    maxs = data.max(axis=0)
    data = (data - mins) / (maxs - mins + 1e-8)
    
    logger.info(f"Loaded {len(data)} time steps from CDC flu data")
    return data, mins, maxs


# ── Training ──────────────────────────────────────────────────────────────────

def train(
    data_path: str,
    output_dir: str,
    epochs: int = 50,
    seq_len: int = 30,
    forecast_horizon: int = 7,
    batch_size: int = 64,
    lr: float = 1e-3,
):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load data
    data, mins, maxs = load_cdc_flu_data(data_path)
    
    # Train/val split (80/20, keeping temporal order)
    split = int(len(data) * 0.8)
    train_data = data[:split]
    val_data = data[split:]
    
    train_dataset = OutbreakDataset(train_data, seq_len, forecast_horizon)
    val_dataset = OutbreakDataset(val_data, seq_len, forecast_horizon)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    logger.info(f"Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}")
    
    # Model
    model = OutbreakLSTM(
        n_features=3,
        hidden_size=128,
        num_layers=2,
        dropout=0.2,
        forecast_horizon=forecast_horizon,
    ).to(DEVICE)
    
    logger.info(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Training setup
    criterion = nn.HuberLoss(delta=0.5)  # Robust to outliers
    optimiser = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimiser, patience=5, factor=0.5, verbose=True
    )
    
    best_val_loss = float("inf")
    history = {"train_loss": [], "val_loss": []}
    
    for epoch in range(epochs):
        # Training
        model.train()
        train_losses = []
        for x, y in train_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            optimiser.zero_grad()
            pred = model(x)
            loss = criterion(pred, y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimiser.step()
            train_losses.append(loss.item())
        
        # Validation
        model.eval()
        val_losses = []
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                pred = model(x)
                loss = criterion(pred, y)
                val_losses.append(loss.item())
        
        train_loss = np.mean(train_losses)
        val_loss = np.mean(val_losses)
        scheduler.step(val_loss)
        
        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        
        if (epoch + 1) % 10 == 0:
            logger.info(f"Epoch {epoch+1}/{epochs} | Train: {train_loss:.4f} | Val: {val_loss:.4f}")
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), output_path / "lstm_best.pt")
    
    # Save final model and metadata
    torch.save(model.state_dict(), output_path / "lstm.pt")
    
    metadata = {
        "n_features": 3,
        "hidden_size": 128,
        "num_layers": 2,
        "seq_len": seq_len,
        "forecast_horizon": forecast_horizon,
        "best_val_loss": float(best_val_loss),
        "epochs_trained": epochs,
        "normalisation_mins": mins.tolist(),
        "normalisation_maxs": maxs.tolist(),
    }
    with open(output_path / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Training complete. Best val loss: {best_val_loss:.4f}")
    logger.info(f"Model saved to {output_path}")
    
    return model, history


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train FAHIN Outbreak Forecast Model")
    parser.add_argument("--data", required=True, help="Path to CDC flu CSV")
    parser.add_argument("--output", default="ml/models/outbreak_forecast/", help="Output dir")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--seq_len", type=int, default=30)
    parser.add_argument("--forecast_horizon", type=int, default=7)
    parser.add_argument("--batch_size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()
    
    train(
        args.data, args.output,
        epochs=args.epochs,
        seq_len=args.seq_len,
        forecast_horizon=args.forecast_horizon,
        batch_size=args.batch_size,
        lr=args.lr,
    )
