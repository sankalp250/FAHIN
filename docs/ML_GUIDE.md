# 🧬 FAHIN — ML Training Guide

## Overview

FAHIN trains 4 models in this order:
1. Symptom Embedding Model (needed by other models)
2. Disease Classification Model
3. Outbreak Forecast Model  
4. Anomaly Detection Model

---

## Step 0: Environment Setup

```bash
cd ml/
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**`ml/requirements.txt`:**
```
torch==2.2.0
transformers==4.38.0
scikit-learn==1.4.0
xgboost==2.0.3
pandas==2.2.0
numpy==1.26.4
opacus==1.4.0          # Differential Privacy for PyTorch
flwr==1.7.0            # Flower Federated Learning
datasets==2.17.0       # HuggingFace datasets
pgvector==0.2.4
psycopg2-binary==2.9.9
python-dotenv==1.0.0
wandb==0.16.3          # Experiment tracking (optional)
matplotlib==3.8.2
seaborn==0.13.2
```

---

## Step 1: Download Datasets

### Dataset 1A: Symptom-Disease (Primary)

**Source:** Kaggle — Disease Symptom Description Dataset  
**URL:** https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset  
**Files needed:** `dataset.csv`, `symptom_Description.csv`, `symptom_precaution.csv`

```bash
# Install Kaggle CLI
pip install kaggle
# Download (requires Kaggle API key in ~/.kaggle/kaggle.json)
kaggle datasets download -d itachi9604/disease-symptom-description-dataset -p ml/data/raw/
unzip ml/data/raw/disease-symptom-description-dataset.zip -d ml/data/raw/disease_symptom/
```

**Format:**
```
Disease, Symptom_1, Symptom_2, ..., Symptom_17
Fungal infection, itching, skin_rash, nodal_skin_eruptions, ...
```

### Dataset 1B: Symptom2Disease

**Source:** Kaggle — Symptom2Disease  
**URL:** https://www.kaggle.com/datasets/niyarrbarman/symptom2disease  

```bash
kaggle datasets download -d niyarrbarman/symptom2disease -p ml/data/raw/
```

### Dataset 2: CDC Disease Surveillance

**Source:** CDC Open Data  
**URL:** https://data.cdc.gov/browse?category=Public+Health+Surveillance  
**Specific datasets to download:**
- National Notifiable Diseases Surveillance System (NNDSS)
- FluView data (weekly influenza surveillance)

```bash
# Direct download via CDC API
curl "https://data.cdc.gov/api/views/9bhg-hcku/rows.csv?accessType=DOWNLOAD" \
  -o ml/data/raw/cdc_flu_weekly.csv
```

### Dataset 3: MIMIC-IV (Hospital Admissions)

**Source:** PhysioNet  
**URL:** https://physionet.org/content/mimiciv/2.2/  
**Access:** Requires credentialed access (free, requires training course ~30 min)

1. Complete CITI training at https://physionet.org/about/citi-course/
2. Request access to MIMIC-IV on PhysioNet
3. Download `hosp/admissions.csv.gz` and `hosp/diagnoses_icd.csv.gz`

```bash
# After access granted:
wget -r -N -c -np \
  --user your_physionet_username \
  --ask-password \
  https://physionet.org/files/mimiciv/2.2/hosp/admissions.csv.gz
```

### Dataset 4: Air Quality (India)

**Source:** Kaggle  
**URL:** https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india  

```bash
kaggle datasets download -d rohanrao/air-quality-data-in-india -p ml/data/raw/
```

---

## Step 2: Train Model 1 — Symptom Embedding

```bash
python training/train_symptom_embedder.py \
  --data ml/data/raw/disease_symptom/dataset.csv \
  --output ml/models/symptom_embedding/ \
  --epochs 10 \
  --batch_size 32
```

**What this does:**
- Fine-tunes `dmis-lab/biobert-base-cased-v1.2` on symptom-disease pairs
- Uses contrastive learning: symptoms of the same disease are pulled together
- Saves model weights to `ml/models/symptom_embedding/model.pt`
- Saves tokeniser to `ml/models/symptom_embedding/tokenizer/`

**Expected training time:** ~2 hours on GPU, ~8 hours on CPU

---

## Step 3: Train Model 2 — Disease Classifier

```bash
python training/train_disease_classifier.py \
  --data ml/data/raw/disease_symptom/dataset.csv \
  --embedder ml/models/symptom_embedding/model.pt \
  --output ml/models/disease_classifier/ \
  --cv_folds 5
```

**What this does:**
- Loads symptom-disease dataset
- Generates symptom embeddings using Model 1
- Trains XGBoost + Random Forest + LogReg ensemble
- 5-fold cross-validation
- Saves ensemble to `ml/models/disease_classifier/ensemble.pkl`

**Expected metrics:**
- Accuracy: ~92%
- Macro F1: ~0.88
- Top-3 accuracy: ~97%

---

## Step 4: Train Model 3 — Outbreak Forecaster

```bash
python training/train_outbreak_forecaster.py \
  --data ml/data/raw/cdc_flu_weekly.csv \
  --output ml/models/outbreak_forecast/ \
  --epochs 50 \
  --seq_len 30 \
  --forecast_horizon 7
```

**What this does:**
- Prepares 30-day rolling windows from CDC weekly flu data
- Trains LSTM with hidden_size=128
- Validates on held-out 2022–2023 flu season
- Saves model to `ml/models/outbreak_forecast/lstm.pt`

**Expected metrics:**
- MAE: < 50 cases/day
- MAPE: < 15%

---

## Step 5: Train Model 4 — Anomaly Detector

```bash
python training/train_anomaly_detector.py \
  --normal_data ml/data/processed/normal_symptom_clusters.npy \
  --output ml/models/anomaly_detection/ \
  --epochs 100 \
  --threshold_sigma 3.0
```

**What this does:**
- Trains autoencoder on "normal" symptom cluster embeddings
- Sets anomaly threshold at 3σ above mean reconstruction error
- Also trains Isolation Forest as backup detector
- Saves both to `ml/models/anomaly_detection/`

---

## Step 6: Evaluate All Models

```bash
python evaluation/evaluate_all.py \
  --test_data ml/data/processed/test_set.csv \
  --model_dir ml/models/ \
  --output ml/evaluation/results/
```

This generates:
- `results/classification_report.json`
- `results/forecast_metrics.json`
- `results/anomaly_detection_pr_curve.png`
- `results/model_comparison.html`

---

## Step 7: Export Models for Serving

```bash
# Convert to ONNX for faster inference (optional)
python training/export_onnx.py --model_dir ml/models/

# Or use TorchScript
python training/export_torchscript.py --model_dir ml/models/
```

---

## Federated Learning Setup

### Start the Flower Server

```bash
cd backend/
python app/services/federated/fl_server.py \
  --rounds 20 \
  --min_clients 3 \
  --model disease_classifier
```

### Register a Hospital as FL Client

```bash
# On the hospital's system (they run this locally)
python app/services/federated/fl_client.py \
  --hospital_id <hospital_uuid> \
  --server_address fahin.yourserver.com:8080 \
  --data_path /path/to/local/hospital/data.csv \
  --dp_epsilon 1.0
```

### Differential Privacy Settings

| Setting | Value | Notes |
|---|---|---|
| ε (epsilon) | 1.0 per round | Strong privacy guarantee |
| δ (delta) | 1e-5 | Standard for medical data |
| Clipping norm | 1.0 | Gradient clipping |
| Noise multiplier | Computed by Opacus | Based on ε and δ |

---

## Dataset Summary Table

| Dataset | URL | Size | Used For |
|---|---|---|---|
| Disease Symptom (Kaggle) | kaggle.com/itachi9604 | 4.9 MB | Models 1, 2 |
| Symptom2Disease (Kaggle) | kaggle.com/niyarrbarman | 1.2 MB | Model 2 (augment) |
| CDC FluView | data.cdc.gov | 50 MB | Model 3 |
| MIMIC-IV Admissions | physionet.org/mimiciv | 2.5 GB | Model 3 (secondary) |
| Air Quality India | kaggle.com/rohanrao | 26 MB | City Risk features |
| WHO ICD-10 Codes | who.int/classifications | 5 MB | Label mapping |

---

## Experiment Tracking

We use Weights & Biases (wandb) for experiment tracking:

```bash
wandb login  # one-time setup
# All training scripts auto-log to wandb if WANDB_API_KEY is set
export WANDB_API_KEY=your_key
```

Tracked metrics per run:
- Train/val loss curves
- Accuracy per disease class
- Confusion matrices
- Model size and inference latency
