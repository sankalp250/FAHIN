"""
FAHIN — Disease Classifier Training Script
Model: Ensemble (XGBoost + Random Forest + Logistic Regression)
Input: Symptom features + environmental features
Output: Disease probability distribution
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier
import joblib
import argparse
import logging
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── All 41 diseases from the Kaggle dataset ──────────────────────────────────
DISEASES = [
    "Fungal infection", "Allergy", "GERD", "Chronic cholestasis",
    "Drug Reaction", "Peptic ulcer disease", "AIDS", "Diabetes",
    "Gastroenteritis", "Bronchial Asthma", "Hypertension", "Migraine",
    "Cervical spondylosis", "Paralysis (brain hemorrhage)", "Jaundice",
    "Malaria", "Chicken pox", "Dengue", "Typhoid", "hepatitis A",
    "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E",
    "Alcoholic hepatitis", "Tuberculosis", "Common Cold", "Pneumonia",
    "Dimorphic hemmorhoids", "Heart attack", "Varicella",
    "Hypothyroidism", "Hyperthyroidism", "Hypoglycemia", "Osteoarthritis",
    "Arthritis", "(Vertigo) Paroxysmal Positional Vertigo", "Acne",
    "Urinary tract infection", "Psoriasis", "Impetigo"
]

# ── All 131 symptoms from the dataset ────────────────────────────────────────
SYMPTOMS = [
    "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing",
    "shivering", "chills", "joint_pain", "stomach_pain", "acidity",
    "ulcers_on_tongue", "muscle_wasting", "vomiting", "burning_micturition",
    "spotting_urination", "fatigue", "weight_gain", "anxiety",
    "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness",
    "lethargy", "patches_in_throat", "irregular_sugar_level", "cough",
    "high_fever", "sunken_eyes", "breathlessness", "sweating", "dehydration",
    "indigestion", "headache", "yellowish_skin", "dark_urine", "nausea",
    "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation",
    "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine",
    "yellowing_of_eyes", "acute_liver_failure", "fluid_overload",
    "swelling_of_stomach", "swelled_lymph_nodes", "malaise",
    "blurred_and_distorted_vision", "phlegm", "throat_irritation",
    "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion",
    "chest_pain", "weakness_in_limbs", "fast_heart_rate",
    "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool",
    "irritation_in_anus", "neck_pain", "dizziness", "cramps",
    "bruising", "obesity", "swollen_legs", "swollen_blood_vessels",
    "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails",
    "swollen_extremeties", "excessive_hunger", "extra_marital_contacts",
    "drying_and_tingling_lips", "slurred_speech", "knee_pain",
    "hip_joint_pain", "muscle_weakness", "stiff_neck", "swelling_joints",
    "movement_stiffness", "spinning_movements", "loss_of_balance",
    "unsteadiness", "weakness_of_one_body_side", "loss_of_smell",
    "bladder_discomfort", "foul_smell_of_urine", "continuous_feel_of_urine",
    "passage_of_gases", "internal_itching", "toxic_look_(typhos)",
    "depression", "irritability", "muscle_pain", "altered_sensorium",
    "red_spots_over_body", "belly_pain", "abnormal_menstruation",
    "dischromic_patches", "watering_from_eyes", "increased_appetite",
    "polyuria", "family_history", "mucoid_sputum", "rusty_sputum",
    "lack_of_concentration", "visual_disturbances", "receiving_blood_transfusion",
    "receiving_unsterile_injections", "coma", "stomach_bleeding",
    "distention_of_abdomen", "history_of_alcohol_consumption",
    "fluid_overload.1", "blood_in_sputum", "prominent_veins_on_calf",
    "palpitations", "painful_walking", "pus_filled_pimples",
    "blackheads", "scurring", "skin_peeling", "silver_like_dusting",
    "small_dents_in_nails", "inflammatory_nails", "blister",
    "red_sore_around_nose", "yellow_crust_ooze",
]


def load_and_preprocess(data_path: str) -> tuple:
    """Load Kaggle symptom-disease dataset and encode features."""
    logger.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)
    
    # Normalise column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    
    # Create binary symptom matrix
    symptom_cols = [c for c in df.columns if c.startswith("symptom_")]
    
    # One-hot encode each symptom
    X = pd.DataFrame(0, index=df.index, columns=SYMPTOMS)
    
    for col in symptom_cols:
        for idx, symptom in enumerate(df[col]):
            if pd.notna(symptom):
                symptom_clean = str(symptom).strip().lower().replace(" ", "_")
                if symptom_clean in X.columns:
                    X.loc[idx, symptom_clean] = 1
    
    # Encode disease labels
    le = LabelEncoder()
    y = le.fit_transform(df["disease"].str.strip())
    
    logger.info(f"Dataset: {len(X)} samples, {X.shape[1]} features, {len(le.classes_)} diseases")
    return X.values, y, le


def build_ensemble():
    """Build the XGBoost + RF + LR voting classifier."""
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    
    lr = LogisticRegression(
        multi_class="multinomial",
        max_iter=500,
        C=1.0,
        random_state=42,
    )
    
    ensemble = VotingClassifier(
        estimators=[("xgb", xgb), ("rf", rf), ("lr", lr)],
        voting="soft",  # Average probabilities
        weights=[3, 2, 1],  # XGBoost gets more weight
    )
    
    return ensemble


def train(data_path: str, output_dir: str, cv_folds: int = 5):
    """Full training pipeline."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load data
    X, y, label_encoder = load_and_preprocess(data_path)
    
    # Scale features (important for Logistic Regression)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Build model
    ensemble = build_ensemble()
    
    # Cross-validation
    logger.info(f"Running {cv_folds}-fold cross validation...")
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
    cv_scores = cross_val_score(ensemble, X_scaled, y, cv=cv, scoring="accuracy", n_jobs=-1)
    
    logger.info(f"CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    # Final training on full dataset
    logger.info("Training on full dataset...")
    ensemble.fit(X_scaled, y)
    
    # Evaluate on training set (sanity check)
    y_pred = ensemble.predict(X_scaled)
    train_acc = accuracy_score(y, y_pred)
    logger.info(f"Train accuracy: {train_acc:.4f}")
    
    print("\n" + classification_report(y, y_pred, target_names=label_encoder.classes_))
    
    # Save artifacts
    joblib.dump(ensemble, output_path / "ensemble.pkl")
    joblib.dump(scaler, output_path / "scaler.pkl")
    joblib.dump(label_encoder, output_path / "label_encoder.pkl")
    
    # Save feature list for inference
    feature_metadata = {
        "symptoms": SYMPTOMS,
        "diseases": label_encoder.classes_.tolist(),
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "train_accuracy": float(train_acc),
        "n_samples": len(X),
    }
    with open(output_path / "metadata.json", "w") as f:
        json.dump(feature_metadata, f, indent=2)
    
    logger.info(f"Model saved to {output_path}")
    return ensemble, label_encoder


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train FAHIN Disease Classifier")
    parser.add_argument("--data", required=True, help="Path to dataset.csv")
    parser.add_argument("--output", default="ml/models/disease_classifier/", help="Output directory")
    parser.add_argument("--cv_folds", type=int, default=5, help="Cross-validation folds")
    args = parser.parse_args()
    
    train(args.data, args.output, args.cv_folds)
