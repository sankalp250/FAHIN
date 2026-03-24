# 🏗️ FAHIN — System Architecture

## Overview

FAHIN uses a **microservices + federated** architecture. The system has four major layers:

```
┌─────────────────── PRESENTATION LAYER ───────────────────────┐
│   React Native App    │    Next.js Dashboard    │  Admin UI   │
└───────────────────────┴─────────────────────────┴─────────────┘
                              │ HTTPS / WSS
┌─────────────────── API GATEWAY LAYER ────────────────────────┐
│              Nginx Reverse Proxy + Rate Limiting              │
│              JWT Authentication (Supabase Auth)               │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌─────────────────── BACKEND LAYER ────────────────────────────┐
│                    FastAPI (Python 3.11)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              LangChain Agent Orchestration               │  │
│  │  Privacy Guardian → Symptom → City Risk → Medical →     │  │
│  │  Outbreak Prediction → Alert Agent                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  ML Service  │  │  FL Service  │  │  Notification Svc  │   │
│  │  (PyTorch)   │  │  (Flower)    │  │  (Email/Push)      │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
└───────────────────────────────┬──────────────────────────────┘
                                │
┌─────────────────── DATA LAYER ───────────────────────────────┐
│  PostgreSQL (Supabase)   │   pgvector   │   Redis Cache       │
│  Celery Task Queue       │   Object Storage (FL weights)      │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Symptom Report to Alert

```
[Citizen Mobile App]
      │
      │ POST /api/v1/symptoms/report
      ▼
[FastAPI Ingestion Endpoint]
      │
      │ 1. Validate schema (Pydantic)
      │ 2. Strip any accidental PII (Privacy Guardian Agent)
      │ 3. Save raw report to symptom_reports table
      │ 4. Push task to Celery queue
      ▼
[Celery Worker — Async Processing]
      │
      ├──► [Privacy Guardian Agent]
      │         - spaCy NER: remove names/phones/emails
      │         - Sector-only location retained
      │
      ├──► [Symptom Intelligence Agent]
      │         - Generate symptom embedding (Model 1)
      │         - pgvector similarity search against disease profiles
      │         - Detect symptom clusters in sector
      │
      ├──► [City Risk Agent]
      │         - Fetch AQI from OpenAQ API for sector
      │         - Fetch weather from OpenWeather API
      │         - Compute mosquito/contamination risk index
      │
      ├──► [Medical Knowledge Agent]
      │         - RAG query on pgvector medical_knowledge table
      │         - Retrieve top-5 matching disease papers
      │         - LLM reasoning: "Does the evidence support X?"
      │
      └──► [Outbreak Prediction Agent]
                - Run Disease Classifier (Model 2) → probabilities
                - Run Outbreak Forecaster (Model 3) → 7-day trend
                - Run Anomaly Detector (Model 4) → unusual clusters
                - Aggregate scores with confidence weighting
                │
                ▼
           [Threshold Check]
           probability > 0.70?
                │
           YES ─┘
                │
                ▼
           [Alert Agent]
           - Insert outbreak_predictions record
           - Send push notification to hospital apps
           - Update city heatmap cache (Redis)
           - Log to alert_logs
```

---

## Federated Learning Flow

```
[Central Flower Server]
      │
      │ Broadcast: "Round N — train disease_classifier"
      │
      ├──► [Hospital A — Local Training]
      │         - Load local patient data (never leaves hospital)
      │         - Train 3 epochs on local data
      │         - Apply DP-SGD (Opacus) noise to gradients
      │         - Compute local weights delta
      │         - POST /federated/submit-weights (weights only)
      │
      ├──► [Hospital B — Local Training]
      │         (same process)
      │
      └──► [Hospital C — Local Training]
                (same process)
                │
                ▼
[Flower Server — FedAvg Aggregation]
      - Receive weights from all participating hospitals
      - Weighted average (by num_samples_trained)
      - Update global model
      - Broadcast updated weights back to hospitals
      │
      ▼
[ML Service — Deploy Updated Model]
      - Save new model version to object storage
      - Hot-reload inference service
      - Log round completion to federated_updates table
```

---

## Agent Architecture (LangChain)

Each agent is a `LangChain AgentExecutor` with:
- A dedicated system prompt
- Access to specific tools (database queries, API calls, ML inference)
- Memory: `ConversationSummaryMemory` (summarises long agent chains)

### Agent Tool Map

| Agent | Tools Available |
|---|---|
| Privacy Guardian | `strip_pii`, `validate_sector`, `hash_identifier` |
| Symptom Intelligence | `embed_symptoms`, `cluster_search`, `sector_query` |
| City Risk | `fetch_aqi`, `fetch_weather`, `compute_risk_index` |
| Medical Knowledge | `rag_search`, `disease_lookup`, `drug_interaction_check` |
| Outbreak Prediction | `run_classifier`, `run_forecaster`, `run_anomaly_detector`, `send_alert` |

### Agent Orchestration Pattern

```python
# backend/app/services/agents/orchestrator.py

from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph

# Agents are connected as a directed graph (LangGraph)
workflow = StateGraph(OutbreakDetectionState)

workflow.add_node("privacy_guardian", privacy_guardian_agent)
workflow.add_node("symptom_intelligence", symptom_intelligence_agent)
workflow.add_node("city_risk", city_risk_agent)
workflow.add_node("medical_knowledge", medical_knowledge_agent)
workflow.add_node("outbreak_prediction", outbreak_prediction_agent)
workflow.add_node("alert", alert_agent)

# Linear flow with conditional branch
workflow.set_entry_point("privacy_guardian")
workflow.add_edge("privacy_guardian", "symptom_intelligence")
workflow.add_edge("symptom_intelligence", "city_risk")
workflow.add_edge("city_risk", "medical_knowledge")
workflow.add_edge("medical_knowledge", "outbreak_prediction")

# Conditional: only send alert if threshold exceeded
workflow.add_conditional_edges(
    "outbreak_prediction",
    should_alert,                  # returns "alert" or END
    {"alert": "alert", END: END}
)
```

---

## ML Model Architecture Details

### Model 1: Symptom Embedding (Transformer)

```
Input: "fever, joint pain, headache, rash"
   ↓
Tokeniser (BiomedBERT tokeniser)
   ↓
BERT Encoder (12 layers, 768 hidden dim)
   ↓
Mean pooling over token embeddings
   ↓
Output: 768-dim float32 vector
```

- **Base model:** `dmis-lab/biobert-base-cased-v1.2` (fine-tuned)
- **Training:** Contrastive learning — symptoms of same disease cluster together
- **Stored in:** pgvector `symptom_reports.embedding`

### Model 2: Disease Classifier (Ensemble)

```
Input features (26 total):
  - Symptom one-hot encoding (20 binary features)
  - Age group (ordinal)
  - AQI (normalised)
  - Temperature (normalised)
  - Humidity (normalised)
  - Season (one-hot)

Model stack:
  XGBoost (n_estimators=300, max_depth=6)
  Random Forest (n_estimators=200)
  Logistic Regression (multi-class, C=1.0)
  → Soft voting ensemble

Output: Probability distribution over 41 diseases
```

### Model 3: Outbreak Forecast (LSTM)

```
Input: 30-day time series
  - daily symptom count per sector
  - daily pharmacy sales (normalised)
  - daily hospital admissions

LSTM architecture:
  Input layer: (batch, 30, 3)
  LSTM layer 1: hidden_size=128, dropout=0.2
  LSTM layer 2: hidden_size=64
  Dense layer: 64 → 7
  Output: 7-day forecast (case counts)

Loss: Huber loss (robust to outliers)
Optimiser: AdamW, lr=1e-3
```

### Model 4: Anomaly Detector (Autoencoder)

```
Input: Daily symptom cluster embedding (768-dim)
   ↓
Encoder:
  768 → 256 (ReLU)
  256 → 64  (ReLU)
  64  → 16  (bottleneck)
   ↓
Decoder:
  16  → 64  (ReLU)
  64  → 256 (ReLU)
  256 → 768 (Sigmoid)
   ↓
Reconstruction error = anomaly score
Threshold: 3σ above training distribution mean
```

---

## Security Architecture

```
Internet
    │
[Cloudflare WAF + DDoS protection]
    │
[Nginx]
  - SSL termination
  - Rate limiting (100 req/min per IP)
  - CORS headers
    │
[FastAPI]
  - JWT validation (every request)
  - Pydantic input validation
  - Role-based access control
    │
[Database]
  - Row Level Security (Supabase)
  - Connection pooling (PgBouncer)
  - Encrypted at rest (AES-256)
    │
[ML Models]
  - Models never see raw PII
  - Inputs sanitised by Privacy Guardian
  - Differential Privacy (ε = 1.0 per FL round)
```

---

## Scalability Design

| Component | Scaling Strategy |
|---|---|
| FastAPI | Horizontal — multiple Uvicorn workers behind Nginx |
| Celery workers | Auto-scale with Redis queue depth |
| PostgreSQL | Supabase managed — read replicas for dashboard queries |
| ML inference | Batch inference every 15 min via Celery beat |
| Flower FL server | Single coordinator (can shard by region) |
| Redis | Supabase Cache (managed) |

---

## Monitoring Stack

```
Prometheus scrapes metrics from:
  - FastAPI (prometheus_fastapi_instrumentator)
  - Celery (flower_monitor exporter)
  - PostgreSQL (postgres_exporter)
  - ML service (custom /metrics endpoint)

Grafana dashboards:
  - API latency + error rates
  - Agent pipeline throughput
  - ML model accuracy drift
  - Federated learning round completion
  - Outbreak alert count by sector
```
