# 🧠 FAHIN — Federated Agentic Health Intelligence Network

<div align="center">

![FAHIN Banner](docs/diagrams/banner.png)

**City-wide AI disease outbreak detection — without sharing raw patient data.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-red.svg)](https://pytorch.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.1+-yellow.svg)](https://langchain.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

</div>

---

## 📌 What Is FAHIN?

FAHIN is a **privacy-preserving AI system** that enables hospitals, pharmacies, wearable devices, and citizens to **collaboratively detect disease outbreaks** — without ever sharing raw patient data.

> **Real Problem:** Cities detect flu/dengue outbreaks weeks after they begin. FAHIN predicts outbreaks **7–14 days in advance** using federated machine learning and LangChain agents.

### The Core Insight

Instead of centralising sensitive patient records, each hospital trains ML models **locally**. Only **model weights** (not data) are shared with a central aggregation server. This is called **Federated Learning**.

```
Traditional:  Hospital → sends patient data → Central Server  ❌ (Privacy violation)
FAHIN:        Hospital → trains locally → sends weights only  ✅ (Privacy preserved)
```

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🤖 **Agentic AI** | 5 LangChain agents that collaborate autonomously |
| 🔒 **Federated Learning** | Hospitals train locally; only weights are shared |
| 🧬 **4 ML Models** | Disease classification, outbreak forecasting, anomaly detection, symptom embedding |
| 📱 **Mobile App** | React Native app for citizen symptom reporting |
| 🗺️ **City Heatmap** | Live risk visualisation by city sector |
| 🛡️ **Privacy AI** | Differential privacy + homomorphic encryption |
| ⚡ **Early Alerts** | Hospitals notified 7–14 days before outbreak peaks |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│  📱 Mobile App   🏥 Hospital API   💊 Pharmacy   🌡️ Wearables    │
└──────────┬──────────────┬──────────────┬──────────────┬─────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY GUARDIAN AGENT                        │
│         Strips PII → anonymises → passes clean data              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│  SYMPTOM INTEL   │ │  CITY RISK AGENT │ │  MEDICAL KNOWLEDGE   │
│     AGENT        │ │                  │ │       AGENT          │
│  Pattern detect  │ │  AQI + weather   │ │  WHO papers + RAG    │
│  Cluster reports │ │  correlations    │ │  pgvector search     │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         └─────────────────────┼─────────────────────┘
                               ▼
                ┌──────────────────────────┐
                │  OUTBREAK PREDICTION     │
                │       AGENT              │
                │  LSTM + Transformer      │
                │  Anomaly Detection       │
                └──────────────┬───────────┘
                               ▼
                ┌──────────────────────────┐
                │  ALERT + RESPONSE AGENT  │
                │  Hospital notifications  │
                │  City dashboard updates  │
                └──────────────────────────┘
```

---

## 📁 Project Structure

```
FAHIN/
├── 📂 backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/      # REST API routes
│   │   ├── core/                  # Config, security, logging
│   │   ├── db/                    # Database sessions, migrations
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   └── services/
│   │       ├── agents/            # LangChain agent definitions
│   │       ├── ml/                # ML inference services
│   │       └── federated/         # Federated learning coordinator
│   └── alembic/                   # DB migrations
│
├── 📂 frontend/                   # Next.js 14 web dashboard
│   ├── app/
│   │   ├── dashboard/             # City overview + heatmap
│   │   ├── symptoms/              # Symptom checker UI
│   │   ├── alerts/                # Outbreak alerts
│   │   ├── pharmacy/              # Pharmacy sales tracking
│   │   └── admin/                 # Hospital admin panel
│   └── components/
│       ├── ui/                    # Reusable UI components
│       ├── charts/                # Disease trend charts
│       └── maps/                  # City risk heatmap
│
├── 📂 ml/                         # Machine learning
│   ├── models/
│   │   ├── symptom_embedding/     # Transformer symptom vectoriser
│   │   ├── disease_classifier/    # Random Forest + XGBoost
│   │   ├── outbreak_forecast/     # LSTM + Temporal Transformer
│   │   └── anomaly_detection/     # Isolation Forest + Autoencoder
│   ├── training/                  # Training scripts
│   ├── evaluation/                # Metrics and benchmarks
│   └── data/                      # Dataset loaders
│
├── 📂 mobile/                     # React Native mobile app
│   └── src/
│       ├── screens/               # App screens
│       ├── components/            # Reusable components
│       ├── services/              # API service calls
│       └── navigation/            # App navigation
│
├── 📂 infra/                      # Infrastructure
│   ├── docker/                    # Docker configurations
│   ├── k8s/                       # Kubernetes manifests
│   └── nginx/                     # Reverse proxy config
│
└── 📂 docs/                       # Documentation
    ├── ARCHITECTURE.md            # Deep-dive architecture
    ├── DB_SCHEMA.md               # Full database schema
    ├── API_REFERENCE.md           # All API endpoints
    ├── ML_GUIDE.md                # Model training guide
    ├── FEDERATED_LEARNING.md      # FL implementation guide
    └── DEPLOYMENT.md              # Production deployment guide
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Mobile** | React Native + Expo | Citizen symptom reporting |
| **Frontend** | Next.js 14 + Tailwind | Hospital/admin dashboards |
| **Backend** | FastAPI (Python 3.11) | REST API, agent orchestration |
| **Agents** | LangChain + LangGraph | Autonomous AI coordination |
| **LLM** | GPT-4o / Gemini Pro | Medical knowledge reasoning |
| **ML** | PyTorch 2.2 + Scikit-learn | Model training & inference |
| **Federated** | Flower (flwr) 1.x | Federated learning coordination |
| **Database** | PostgreSQL + Supabase | Primary data store |
| **Vector DB** | pgvector | Medical knowledge retrieval |
| **Cache** | Redis | Session + prediction cache |
| **Queue** | Celery + Redis | Async agent task execution |
| **Monitoring** | Prometheus + Grafana | System observability |
| **Auth** | Supabase Auth + JWT | User authentication |
| **Deployment** | Docker + Kubernetes | Container orchestration |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required versions
Python 3.11+
Node.js 20+
Docker + Docker Compose
PostgreSQL 15+
```

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/fahin.git
cd fahin
```

### 2. Environment Setup

```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit with your values
nano backend/.env
```

**Backend `.env` key variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fahin
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-min-32-chars
FLOWER_SERVER_ADDRESS=0.0.0.0:8080
```

### 3. Start with Docker Compose

```bash
cd infra/docker
docker-compose up -d
```

This starts: PostgreSQL, Redis, Backend API, Celery worker, Flower FL server.

### 4. Run Database Migrations

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python app/db/seed.py  # Optional: seed demo data
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

### 6. Train ML Models

```bash
cd ml
pip install -r requirements.txt

# Download datasets first (see docs/ML_GUIDE.md)
python training/train_disease_classifier.py
python training/train_outbreak_forecaster.py
python training/train_anomaly_detector.py
python training/train_symptom_embedder.py
```

---

## 🧬 The 4 ML Models

### Model 1: Symptom Embedding Model
- **Architecture:** BERT-based Transformer (fine-tuned)
- **Input:** Raw symptom text (e.g., "fever, joint pain, headache")
- **Output:** 768-dim embedding vector
- **Use:** Similarity search between diseases via pgvector
- **Training data:** Symptom-Disease Dataset (Kaggle)

### Model 2: Disease Classification Model
- **Architecture:** Ensemble (XGBoost + Random Forest + Logistic Regression)
- **Input:** Symptom vector + age + environmental features (AQI, temp, humidity)
- **Output:** Top-5 probable diseases with confidence scores
- **Diseases covered:** 40+ (flu, dengue, malaria, COVID, cholera, etc.)
- **Training data:** CDC Surveillance + WHO datasets

### Model 3: Outbreak Forecast Model
- **Architecture:** LSTM + Temporal Fusion Transformer
- **Input:** 30-day rolling window of daily symptom counts by city sector
- **Output:** 7-day ahead case count forecast
- **Use:** Predicts outbreak peaks before they occur
- **Training data:** MIMIC-IV + WHO infectious disease datasets

### Model 4: Anomaly Detection Model
- **Architecture:** Isolation Forest + Deep Autoencoder (PyTorch)
- **Input:** Daily symptom cluster embeddings
- **Output:** Anomaly score + cluster flagging
- **Use:** Detects **unknown diseases** — the key innovation
- **Training data:** Historical outbreak data + synthetic normal baselines

---

## 🤖 The 5 LangChain Agents

### Agent 1: Privacy Guardian
- Strips names, phone numbers, addresses before any processing
- Uses regex + NER model (spaCy)
- Runs on every incoming data packet

### Agent 2: Symptom Intelligence Agent
- Parses citizen symptom reports
- Groups similar symptoms into clusters
- Compares clusters to known disease profiles using pgvector

### Agent 3: City Risk Agent
- Pulls AQI data from OpenAQ API
- Fetches weather data (temperature, humidity, rainfall)
- Correlates environment signals with disease probability models

### Agent 4: Medical Knowledge Agent
- RAG pipeline over WHO medical papers + CDC guidelines
- Uses pgvector for semantic similarity search
- Returns evidence-backed disease hypotheses

### Agent 5: Outbreak Prediction Agent
- Runs all 4 ML models
- Aggregates predictions with confidence weighting
- Triggers alerts when outbreak probability > threshold (default: 70%)

---

## 🗄️ Database Schema (Supabase/PostgreSQL)

See [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md) for full schema with indexes and RLS policies.

**Core tables:**

```sql
users                  -- Citizens, doctors, admins (anonymised)
symptom_reports        -- Citizen symptom submissions
prescription_records   -- Doctor/clinic uploads (OCR extracted)
medicine_sales         -- Pharmacy aggregate sales data
hospital_stats         -- Aggregated hospital admissions (no PII)
city_sensor_data       -- AQI, weather, water quality by sector
outbreak_predictions   -- ML model prediction logs
federated_updates      -- FL model weight updates from hospitals
alert_logs             -- Sent alerts to hospitals/authorities
```

---

## 🔒 Privacy & Security

| Mechanism | Implementation |
|---|---|
| **Differential Privacy** | Add calibrated noise to gradients (DP-SGD via Opacus) |
| **Federated Learning** | Only model weights leave hospital systems |
| **Data Minimisation** | Store sector, not exact address; no names/phones |
| **Encryption at rest** | AES-256 (Supabase default) |
| **Secure aggregation** | Homomorphic encryption on FL weight aggregation |
| **Row-Level Security** | Supabase RLS policies per user role |
| **API Gateway** | JWT + rate limiting on all endpoints |

---

## 📊 API Overview

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/symptoms/report` | Submit symptom report |
| POST | `/prescriptions/upload` | Upload prescription image |
| GET | `/predictions/sector/{id}` | Get outbreak prediction for sector |
| GET | `/dashboard/city-heatmap` | City-wide risk heatmap |
| POST | `/pharmacy/sales` | Submit medicine sales data |
| POST | `/hospitals/stats` | Submit hospital aggregated stats |
| GET | `/alerts/active` | List active outbreak alerts |
| POST | `/federated/submit-weights` | Hospital FL weight submission |
| GET | `/agents/status` | Agent pipeline health check |

Full docs at `http://localhost:8000/docs` (Swagger UI).

---

## 🗺️ Example Scenario (End-to-End)

```
Day 1: 
  → 200 citizens in Sector 45 report "fever + joint pain + headache"
  → 3 pharmacies report 300% spike in paracetamol + dengue test kits
  → City Risk Agent detects monsoon humidity at 94% (dengue risk factor)

Day 2:
  → Anomaly Detection Model flags unusual symptom cluster
  → Medical Knowledge Agent retrieves WHO dengue guidelines
  → Outbreak Forecast Model predicts: 1,200 cases by Day 8

Day 3:
  → Alert sent to 12 hospitals in Sector 45 vicinity
  → Hospital dashboard shows: "Dengue outbreak predicted — 5 days away"
  → Hospitals prepare: extra IV bags, blood test kits, isolation wards
  → City health authority notified

Day 8:
  → Outbreak peaks at 1,080 cases (within forecast range)
  → Hospitals already prepared → zero capacity crisis
```

---

## 📚 Documentation Index

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Deep system architecture with diagrams |
| [DB_SCHEMA.md](docs/DB_SCHEMA.md) | Full PostgreSQL schema + Supabase config |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | All endpoints with request/response examples |
| [ML_GUIDE.md](docs/ML_GUIDE.md) | Model training steps + dataset links |
| [FEDERATED_LEARNING.md](docs/FEDERATED_LEARNING.md) | FL setup + hospital onboarding |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add X'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for code standards.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for cities. Powered by federated AI. Protecting privacy by design.
</div>
