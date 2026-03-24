"""
FAHIN — Flower Federated Learning Client (runs at hospital side)
Trains model locally, applies DP noise, sends weights to FL server.
"""
import flwr as fl
import numpy as np
import pandas as pd
import logging
import argparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from typing import List, Tuple, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SYMPTOMS = [
    "itching","skin_rash","nodal_skin_eruptions","continuous_sneezing","shivering",
    "chills","joint_pain","stomach_pain","acidity","vomiting","fatigue","weight_loss",
    "anxiety","mood_swings","restlessness","lethargy","cough","high_fever","breathlessness",
    "sweating","dehydration","headache","nausea","loss_of_appetite","back_pain","diarrhoea",
]


def load_local_data(data_path: str):
    df = pd.read_csv(data_path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    symptom_cols = [c for c in df.columns if c.startswith("symptom_")]

    X = pd.DataFrame(0, index=df.index, columns=SYMPTOMS)
    for col in symptom_cols:
        for idx, s in enumerate(df[col]):
            if pd.notna(s):
                s_clean = str(s).strip().lower().replace(" ", "_")
                if s_clean in X.columns:
                    X.loc[idx, s_clean] = 1

    le = LabelEncoder()
    y = le.fit_transform(df["disease"].str.strip())
    return X.values, y, le


class FAHINClient(fl.client.NumPyClient):
    def __init__(self, data_path: str, hospital_id: str, dp_epsilon: float = 1.0):
        self.hospital_id = hospital_id
        self.dp_epsilon = dp_epsilon
        self.model = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
        X, y, self.le = load_local_data(data_path)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
        logger.info(f"Hospital {hospital_id}: {len(self.X_train)} training samples loaded")

    def get_parameters(self, config) -> List[np.ndarray]:
        # Represent RF as feature importances (simplified FL for tree-based models)
        if hasattr(self.model, "feature_importances_"):
            return [self.model.feature_importances_]
        return [np.zeros(len(SYMPTOMS))]

    def fit(self, parameters: List[np.ndarray], config: Dict) -> Tuple:
        # Train on local data
        self.model.fit(self.X_train, self.y_train)

        # Apply differential privacy noise to feature importances
        weights = self.get_parameters(config={})
        if self.dp_epsilon > 0:
            noise_scale = 1.0 / self.dp_epsilon
            weights = [w + np.random.laplace(0, noise_scale, w.shape) for w in weights]

        train_acc = accuracy_score(self.y_train, self.model.predict(self.X_train))
        logger.info(f"[{self.hospital_id}] Local train accuracy: {train_acc:.4f}")

        return weights, len(self.X_train), {"accuracy": train_acc, "loss": 1 - train_acc}

    def evaluate(self, parameters: List[np.ndarray], config: Dict) -> Tuple:
        val_acc = accuracy_score(self.y_test, self.model.predict(self.X_test))
        logger.info(f"[{self.hospital_id}] Validation accuracy: {val_acc:.4f}")
        return 1 - val_acc, len(self.X_test), {"accuracy": val_acc, "loss": 1 - val_acc}


def start_client(hospital_id: str, server_address: str, data_path: str, dp_epsilon: float = 1.0):
    client = FAHINClient(data_path=data_path, hospital_id=hospital_id, dp_epsilon=dp_epsilon)
    fl.client.start_numpy_client(server_address=server_address, client=client)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital_id", required=True)
    parser.add_argument("--server_address", default="localhost:8080")
    parser.add_argument("--data_path", required=True)
    parser.add_argument("--dp_epsilon", type=float, default=1.0)
    args = parser.parse_args()
    start_client(args.hospital_id, args.server_address, args.data_path, args.dp_epsilon)
