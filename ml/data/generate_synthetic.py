"""
FAHIN — Synthetic Dataset Generator
Generates demo data for testing models WITHOUT downloading real datasets.
Output: ml/data/synthetic/dataset.csv (same format as Kaggle symptom-disease dataset)
"""
import pandas as pd
import numpy as np
from pathlib import Path
import random

DISEASES_SYMPTOMS = {
    "Dengue":       ["high_fever","joint_pain","headache","rash","pain_behind_the_eyes","sweating","nausea"],
    "Influenza":    ["fever","cough","sore_throat","body_aches","fatigue","runny_nose","headache"],
    "Malaria":      ["fever","chills","sweating","headache","nausea","vomiting","muscle_pain"],
    "Typhoid":      ["high_fever","headache","abdominal_pain","loss_of_appetite","constipation","weakness"],
    "Dengue":       ["high_fever","joint_pain","rash","pain_behind_the_eyes","nausea"],
    "Pneumonia":    ["cough","chest_pain","breathlessness","fever","phlegm","fatigue"],
    "Gastroenteritis":["vomiting","diarrhoea","abdominal_pain","nausea","dehydration","fever"],
    "Chickenpox":   ["skin_rash","itching","fever","headache","fatigue","blisters"],
    "Tuberculosis": ["cough","blood_in_sputum","fatigue","fever","night_sweats","weight_loss"],
    "Jaundice":     ["yellowish_skin","dark_urine","fatigue","loss_of_appetite","abdominal_pain"],
    "Cholera":      ["diarrhoea","vomiting","dehydration","abdominal_pain","muscle_cramps"],
    "Common Cold":  ["runny_nose","sneezing","sore_throat","cough","congestion","mild_fever"],
}


def generate(n_samples: int = 5000, output_path: str = "ml/data/synthetic/dataset.csv"):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    rows = []
    diseases = list(DISEASES_SYMPTOMS.keys())
    for _ in range(n_samples):
        disease = random.choice(diseases)
        disease_syms = DISEASES_SYMPTOMS[disease]
        # Sample 3-6 symptoms (add 0-2 noise symptoms from other diseases)
        n_core = random.randint(3, min(6, len(disease_syms)))
        selected = random.sample(disease_syms, n_core)
        # Add noise
        all_syms = [s for syms in DISEASES_SYMPTOMS.values() for s in syms]
        noise = random.sample(all_syms, random.randint(0, 2))
        all_selected = list(set(selected + noise))[:17]
        # Pad to 17 columns
        while len(all_selected) < 17:
            all_selected.append(None)
        rows.append([disease] + all_selected)

    cols = ["disease"] + [f"Symptom_{i}" for i in range(1, 18)]
    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(output_path, index=False)
    print(f"✅ Generated {len(df)} synthetic samples → {output_path}")
    print(f"   Diseases: {df['disease'].nunique()}")
    print(f"   Samples per disease: {len(df)//df['disease'].nunique():.0f} avg")
    return df


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=5000)
    parser.add_argument("--output",  default="ml/data/synthetic/dataset.csv")
    args = parser.parse_args()
    generate(args.samples, args.output)
