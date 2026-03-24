# 🔒 FAHIN — Federated Learning Guide

## What is Federated Learning in FAHIN?

Hospitals train ML models on their **local patient data** without ever sending that data to FAHIN's servers. Only the **model weight updates** (not data) are transmitted. FAHIN uses the [Flower framework](https://flower.dev) to coordinate this.

```
WITHOUT FAHIN FL:                    WITH FAHIN FL:
Patient data → Central server        Patient data stays at hospital
       ❌ Privacy violation                 ✅ Privacy preserved
                                     Only model weights → FAHIN server
```

---

## Setup: Central Flower Server

The Flower server runs on FAHIN's infrastructure and coordinates training rounds.

### Start the server

```bash
python backend/app/services/federated/fl_server.py \
  --rounds 20 \
  --min_clients 3 \
  --model disease_classifier \
  --port 8080
```

**Parameters:**
- `--rounds`: Number of federated learning rounds (20 recommended)
- `--min_clients`: Minimum hospitals that must participate per round
- `--model`: Which model to train (`disease_classifier`, `outbreak_forecaster`, `anomaly_detector`)

---

## Setup: Hospital Client

Each participating hospital runs a Flower client on their own infrastructure.

### Requirements (hospital side)
- Python 3.11+
- `flwr==1.7.0`
- `opacus==1.4.0` (differential privacy)
- Access to their local patient data in CSV format

### Installation (hospital side)

```bash
pip install flwr==1.7.0 opacus==1.4.0 torch scikit-learn pandas
```

### Run the client

```bash
python backend/app/services/federated/fl_client.py \
  --hospital_id <your_hospital_uuid> \
  --server_address fahin.yourserver.com:8080 \
  --data_path /path/to/local/data.csv \
  --dp_epsilon 1.0 \
  --model disease_classifier
```

**Parameters:**
- `--hospital_id`: UUID assigned by FAHIN admin (get from admin portal)
- `--server_address`: FAHIN FL server address
- `--data_path`: Local path to hospital's patient symptom data
- `--dp_epsilon`: Privacy budget (lower = more private; 1.0 is strong, 8.0 is weaker)
- `--model`: Which model to train

### Expected local data format

```csv
symptom_1,symptom_2,...,symptom_17,disease
fever,headache,joint_pain,,,,,,,,,,,,,,,,dengue
cough,breathlessness,,,,,,,,,,,,,,,,,pneumonia
```

Same format as the Kaggle symptom-disease dataset.

---

## Privacy Guarantees

### Differential Privacy (DP)

FAHIN uses **DP-SGD** (via PyTorch Opacus) at the hospital client side:

```python
# Applied automatically in fl_client.py
from opacus import PrivacyEngine

privacy_engine = PrivacyEngine()
model, optimiser, data_loader = privacy_engine.make_private_with_epsilon(
    module=model,
    optimiser=optimiser,
    data_loader=train_loader,
    epochs=local_epochs,
    target_epsilon=dp_epsilon,   # Privacy budget
    target_delta=1e-5,
    max_grad_norm=1.0,           # Gradient clipping
)
```

**What DP-SGD does:** Adds calibrated Gaussian noise to gradients during training. This ensures that even if an adversary sees the model weights, they cannot reconstruct individual patient records.

### Privacy Budget Recommendations

| Setting | ε Value | Use Case |
|---|---|---|
| Maximum Privacy | ε = 0.5 | Research hospitals handling sensitive cases |
| Strong Privacy | ε = 1.0 | **Recommended for FAHIN** |
| Moderate Privacy | ε = 4.0 | Acceptable for aggregate data |
| Weak Privacy | ε = 8.0 | Not recommended for medical data |

### What Leaves the Hospital

| Data | Leaves Hospital? |
|---|---|
| Patient names | ❌ Never |
| Patient records | ❌ Never |
| Diagnoses linked to individuals | ❌ Never |
| Model weight updates (with DP noise) | ✅ Yes (this is the FL mechanism) |
| Number of training samples | ✅ Yes (needed for weighted averaging) |
| Local loss/accuracy metrics | ✅ Yes (for monitoring only) |

---

## Aggregation: FedAvg

FAHIN uses **Federated Averaging (FedAvg)** to combine hospital weight updates:

```
Global weights = Σ (hospital_i_weights × n_i) / Σ n_i

Where n_i = number of training samples at hospital i
```

This means hospitals with more data have proportionally more influence on the global model, which is fair and statistically sound.

---

## FL Round Timeline

```
Day 1:  FAHIN server broadcasts: "Round 1 — disease_classifier"
        ↓
        Hospitals train locally (15 min)
        ↓
        Hospitals submit weight deltas
        ↓
        FedAvg aggregation (< 1 min)
        ↓
        FAHIN deploys updated global model

Repeat for 20 rounds.
Total time: ~6 hours (if hospitals run rounds daily)
```

---

## Hospital Onboarding Checklist

1. **Register** your hospital at `https://fahin.yourdomain.com/admin/hospitals/register`
2. **Receive** your `hospital_id` UUID from FAHIN admin
3. **Install** the FL client (see above)
4. **Test connection** with `--dry_run` flag
5. **Configure** your local data path and DP settings
6. **Join** the FL network: your hospital will participate from the next scheduled round

---

## Monitoring (Admin)

FAHIN tracks all FL activity in the `federated_updates` table:

```sql
SELECT 
    hospital_id,
    round_number,
    num_samples_trained,
    local_accuracy,
    epsilon_budget_used,
    aggregated,
    submitted_at
FROM federated_updates
ORDER BY submitted_at DESC;
```

The admin dashboard at `/admin/federated` shows:
- Current FL round
- Participating hospitals this round
- Global model accuracy over rounds
- Per-hospital privacy budget consumption
