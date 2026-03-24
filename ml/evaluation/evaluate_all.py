"""
FAHIN — Evaluate all trained models.
Run: python ml/evaluation/evaluate_all.py --model_dir ml/models/
"""
import argparse
import json
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def evaluate_disease_classifier(model_dir: Path) -> dict:
    import joblib
    import pandas as pd
    from sklearn.metrics import accuracy_score, classification_report
    from sklearn.model_selection import train_test_split

    path = model_dir / "disease_classifier"
    if not (path / "ensemble.pkl").exists():
        return {"status": "model_not_found"}

    clf   = joblib.load(path / "ensemble.pkl")
    scaler= joblib.load(path / "scaler.pkl")
    le    = joblib.load(path / "label_encoder.pkl")

    with open(path / "metadata.json") as f:
        meta = json.load(f)

    logger.info("Disease Classifier:")
    logger.info(f"  CV Accuracy: {meta.get('cv_accuracy_mean',0):.4f} ± {meta.get('cv_accuracy_std',0):.4f}")
    logger.info(f"  Diseases:    {len(meta.get('diseases',[]))}")
    logger.info(f"  Samples:     {meta.get('n_samples',0)}")
    return meta


def evaluate_outbreak_forecaster(model_dir: Path) -> dict:
    import torch
    path = model_dir / "outbreak_forecast"
    if not (path / "lstm.pt").exists():
        return {"status": "model_not_found"}
    with open(path / "metadata.json") as f:
        meta = json.load(f)
    logger.info("Outbreak Forecaster:")
    logger.info(f"  Best Val Loss: {meta.get('best_val_loss',0):.6f}")
    logger.info(f"  Forecast horizon: {meta.get('forecast_horizon',7)} days")
    return meta


def evaluate_anomaly_detector(model_dir: Path) -> dict:
    path = model_dir / "anomaly_detection"
    if not (path / "metadata.json").exists():
        return {"status": "model_not_found"}
    with open(path / "metadata.json") as f:
        meta = json.load(f)
    logger.info("Anomaly Detector:")
    logger.info(f"  Threshold:     {meta.get('autoencoder',{}).get('anomaly_threshold',0):.6f}")
    logger.info(f"  Error std:     {meta.get('autoencoder',{}).get('error_std',0):.6f}")
    return meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate all FAHIN ML models")
    parser.add_argument("--model_dir", default="ml/models/")
    parser.add_argument("--output", default="ml/evaluation/results.json")
    args = parser.parse_args()

    model_dir = Path(args.model_dir)
    results = {
        "disease_classifier": evaluate_disease_classifier(model_dir),
        "outbreak_forecaster": evaluate_outbreak_forecaster(model_dir),
        "anomaly_detector":    evaluate_anomaly_detector(model_dir),
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    logger.info(f"\nResults saved to {output_path}")
