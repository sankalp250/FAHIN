# 🗺️ FAHIN — Implementation Roadmap for Developers

> This document tells you exactly **what to build, in what order, and how**. Follow Phase by Phase.

---

## Phase 0 — Prerequisites (Day 1, ~2 hours)

Before writing any code, set up these accounts/tools:

| Tool | Why | Link |
|---|---|---|
| Supabase | Database + Auth | https://supabase.com |
| OpenAI | LLM for agents | https://platform.openai.com |
| OpenAQ | Air quality data | https://docs.openaq.org |
| OpenWeatherMap | Weather data | https://openweathermap.org/api |
| Kaggle | Download datasets | https://kaggle.com |
| PhysioNet | MIMIC-IV dataset | https://physionet.org |
| Weights & Biases | ML experiment tracking (optional) | https://wandb.ai |

---

## Phase 1 — Database (Day 1–2)

**Goal:** Supabase project fully configured with all tables, indexes, and RLS.

1. Create Supabase project
2. In SQL Editor, run all SQL from `docs/DB_SCHEMA.md` top to bottom
3. Enable pgvector: `Dashboard → Database → Extensions → vector → Enable`
4. Enable Realtime on `outbreak_predictions` and `alert_logs`
5. Create storage buckets: `fahin-prescriptions`, `fahin-fl-weights`
6. Test with a sample INSERT into `symptom_reports`

**Verify:** All 10 tables exist. Vector columns accept 768-dim inputs.

---

## Phase 2 — Backend Core (Day 2–4)

**Goal:** FastAPI running with auth, database connection, and basic endpoints.

### Step-by-step

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Build in this order:

1. `app/core/config.py` ✅ (already scaffolded)
2. `app/db/session.py` — SQLAlchemy async session
3. `app/models/` — ORM models for all 10 tables
4. `app/schemas/` — Pydantic schemas (request/response)
5. `app/core/auth.py` — JWT decode + Supabase auth integration
6. `app/api/v1/endpoints/symptoms.py` ✅ (already scaffolded)
7. `app/api/v1/endpoints/predictions.py`
8. `app/api/v1/endpoints/dashboard.py`
9. `app/main.py` ✅ (already scaffolded)

**Test:**
```bash
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs
# Try POST /api/v1/symptoms/report with dummy data
```

---

## Phase 3 — ML Model Training (Day 3–6, can overlap with Phase 2)

**Goal:** All 4 models trained and saved to `ml/models/`.

### Order matters — train Model 1 first, others depend on it.

#### Model 1: Symptom Embedder
```bash
# Download dataset first
kaggle datasets download -d itachi9604/disease-symptom-description-dataset
# Then train
python ml/training/train_symptom_embedder.py \
  --data ml/data/raw/disease_symptom/dataset.csv \
  --output ml/models/symptom_embedding/
```

Wait for this to finish before Model 2.

#### Model 2: Disease Classifier
```bash
python ml/training/train_disease_classifier.py \
  --data ml/data/raw/disease_symptom/dataset.csv \
  --output ml/models/disease_classifier/
```
Expected output: `ensemble.pkl`, `scaler.pkl`, `label_encoder.pkl`, `metadata.json`

#### Model 3: Outbreak Forecaster
```bash
# Download CDC flu data
curl "https://data.cdc.gov/api/views/9bhg-hcku/rows.csv?accessType=DOWNLOAD" \
  -o ml/data/raw/cdc_flu_weekly.csv
python ml/training/train_outbreak_forecaster.py \
  --data ml/data/raw/cdc_flu_weekly.csv \
  --output ml/models/outbreak_forecast/
```
Expected output: `lstm.pt`, `metadata.json`

#### Model 4: Anomaly Detector
```bash
# For demo: uses synthetic data. For production: generate real embeddings first.
python ml/training/train_anomaly_detector.py \
  --output ml/models/anomaly_detection/
```
Expected output: `autoencoder.pt`, `isolation_forest.pkl`, `metadata.json`

**Evaluate all models:**
```bash
python ml/evaluation/evaluate_all.py --model_dir ml/models/
```

---

## Phase 4 — ML Inference Service (Day 5–7)

**Goal:** FastAPI can call ML models from within the backend.

Create `backend/app/services/ml/`:

```
ml_service.py          # Main inference class
model_registry.py      # Singleton model loader
symptom_embedder.py    # Wraps Model 1
disease_classifier.py  # Wraps Model 2
outbreak_forecaster.py # Wraps Model 3
anomaly_detector.py    # Wraps Model 4
```

Each service should:
1. Load model at startup (not on every request)
2. Accept Python dicts/lists as input
3. Return typed dictionaries as output
4. Handle errors gracefully (return `None` on model failure, don't crash API)

Test with a direct Python call before integrating with agents.

---

## Phase 5 — LangChain Agents (Day 7–10)

**Goal:** All 5 agents wired up in the LangGraph workflow.

Build in this order:

1. `privacy_guardian.py` — Simplest. Uses spaCy NER. Test first.
2. `symptom_intelligence.py` — Calls embedder + pgvector search
3. `city_risk.py` — Calls OpenAQ + OpenWeather APIs
4. `medical_knowledge.py` — RAG on pgvector `medical_knowledge` table
5. `outbreak_prediction.py` — Calls all 4 ML services
6. `alert_agent.py` — Writes to DB + sends notifications
7. `orchestrator.py` ✅ (already scaffolded) — Wire the LangGraph

**Seed the knowledge base first (for Medical Knowledge Agent):**
```bash
python backend/app/db/seed_knowledge.py
# This downloads WHO fact sheets and loads them into medical_knowledge table
```

**Test the full pipeline:**
```bash
python -c "
import asyncio
from backend.app.services.agents.orchestrator import process_symptom_report
asyncio.run(process_symptom_report(
    report_id='test-123',
    sector='Sector-45',
    city='Gurugram'
))
"
```

---

## Phase 6 — Federated Learning (Day 10–12)

**Goal:** Flower server running. Can accept weight updates from simulated clients.

1. Build `backend/app/services/federated/fl_server.py` using Flower's `flwr.server`
2. Build `backend/app/services/federated/fl_client.py` using `flwr.client`
3. Test with 2 simulated hospital clients on the same machine:

```bash
# Terminal 1: Start server
python backend/app/services/federated/fl_server.py --min_clients 2

# Terminal 2: Hospital A client (simulated)
python backend/app/services/federated/fl_client.py \
  --hospital_id hospital-a \
  --data_path ml/data/raw/disease_symptom/dataset.csv \
  --server_address localhost:8080

# Terminal 3: Hospital B client (simulated)
python backend/app/services/federated/fl_client.py \
  --hospital_id hospital-b \
  --data_path ml/data/raw/disease_symptom/dataset.csv \
  --server_address localhost:8080
```

Watch the server log — it should complete 1 FL round and produce aggregated weights.

---

## Phase 7 — Frontend Dashboard (Day 10–14)

**Goal:** Next.js dashboard showing real data from the API.

```bash
cd frontend
npm install
npm run dev
```

Build in this order:

1. `app/layout.tsx` — Root layout with navigation
2. `app/dashboard/page.tsx` ✅ (already scaffolded) — Wire to real API
3. `components/maps/CityHeatmap.tsx` — Leaflet map with sector risk colors
4. `app/symptoms/page.tsx` — Symptom checker web version
5. `app/alerts/page.tsx` — Live alert feed
6. `app/pharmacy/page.tsx` — Medicine sales tracking
7. `app/admin/page.tsx` — Hospital admin panel

**Replace mock data with real API calls using SWR:**
```typescript
import useSWR from "swr";
const { data: heatmap } = useSWR(`/api/v1/dashboard/city-heatmap?city=Gurugram`);
```

---

## Phase 8 — Mobile App (Day 12–16)

**Goal:** React Native app running on phone/emulator.

```bash
cd mobile
npm install
npx expo start
```

Build screens in this order:
1. `SymptomCheckerScreen.tsx` ✅ (already scaffolded)
2. `HomeScreen.tsx` — Health risk for user's sector
3. `AlertsScreen.tsx` — Push notification feed
4. `PrescriptionUploadScreen.tsx` — Camera + OCR upload
5. `ProfileScreen.tsx` — Settings + privacy controls

Configure push notifications via Expo Notifications + Supabase Edge Functions.

---

## Phase 9 — Integration & Testing (Day 15–17)

**Goal:** End-to-end test of the full system.

1. Submit a symptom report via mobile app
2. Watch Celery worker process it
3. See the agent pipeline run (check logs)
4. Verify prediction written to `outbreak_predictions` table
5. If probability > 0.70, verify alert written to `alert_logs`
6. Confirm dashboard heatmap updates

**Load test:**
```bash
# Install locust
pip install locust
locust -f tests/load_test.py --host http://localhost:8000
```

---

## Phase 10 — Deployment (Day 17–20)

See `docs/DEPLOYMENT.md` for full instructions.

Quick production checklist:
- [ ] `DEBUG=False` in production `.env`
- [ ] Strong `SECRET_KEY` (32+ chars)
- [ ] Supabase RLS enabled and tested
- [ ] SSL certificate installed
- [ ] Monitoring dashboards configured

---

## Quick Reference: Key Files to Build

| Priority | File | Description |
|---|---|---|
| 🔴 Critical | `backend/app/db/session.py` | DB connection |
| 🔴 Critical | `backend/app/models/*.py` | ORM models |
| 🔴 Critical | `ml/training/train_disease_classifier.py` | ✅ Done |
| 🔴 Critical | `ml/training/train_outbreak_forecaster.py` | ✅ Done |
| 🔴 Critical | `ml/training/train_anomaly_detector.py` | ✅ Done |
| 🔴 Critical | `backend/app/services/agents/orchestrator.py` | ✅ Done |
| 🟡 Important | `backend/app/services/agents/privacy_guardian.py` | Build next |
| 🟡 Important | `backend/app/services/agents/symptom_intelligence.py` | Build next |
| 🟡 Important | `backend/app/services/agents/outbreak_prediction.py` | Build next |
| 🟡 Important | `frontend/app/dashboard/page.tsx` | ✅ Done |
| 🟡 Important | `mobile/src/screens/SymptomCheckerScreen.tsx` | ✅ Done |
| 🟢 Nice-to-have | `infra/docker/docker-compose.yml` | ✅ Done |
| 🟢 Nice-to-have | `backend/app/services/federated/fl_server.py` | Build last |

---

## Common Issues & Solutions

**Issue:** `pgvector` extension not found  
**Fix:** Run `CREATE EXTENSION vector;` in Supabase SQL Editor

**Issue:** OpenAI API call failing in agents  
**Fix:** Check `OPENAI_API_KEY` in `.env`. Use `gpt-4o-mini` for lower cost.

**Issue:** ML model loading too slow  
**Fix:** Use `ModelRegistry.load_all_models()` at startup, not per-request

**Issue:** Celery tasks not processing  
**Fix:** Ensure Redis is running: `redis-cli ping` should return `PONG`

**Issue:** FL client can't connect to server  
**Fix:** Check firewall — port 8080 must be open. Use `grpc` transport.
