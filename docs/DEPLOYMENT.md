# 🚀 FAHIN — Deployment Guide

## Overview

FAHIN supports three deployment tiers:

| Tier | Use Case | Infrastructure |
|---|---|---|
| **Local Dev** | Development & testing | Docker Compose |
| **Staging** | Pre-prod validation | Single VPS + Docker |
| **Production** | City-scale deployment | Kubernetes + Supabase Cloud |

---

## Tier 1: Local Development

### Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+

### Steps

```bash
# 1. Clone repo
git clone https://github.com/your-org/fahin.git && cd fahin

# 2. Create env file
cp backend/.env.example backend/.env
# Fill in: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY

# 3. Start all services
cd infra/docker
docker-compose up -d

# 4. Run migrations
cd ../../backend
pip install -r requirements.txt
alembic upgrade head

# 5. Start frontend (separate terminal)
cd ../frontend
npm install && npm run dev

# 6. Access
#   Frontend:  http://localhost:3000
#   API docs:  http://localhost:8000/docs
#   API:       http://localhost:8000/api/v1
#   FL server: localhost:8080
```

---

## Tier 2: Staging (Single VPS)

### Recommended VPS specs
- 4 vCPU, 8GB RAM, 80GB SSD
- Ubuntu 22.04 LTS
- Ports open: 80, 443, 8080

### Steps

```bash
# 1. SSH into VPS and clone repo
ssh ubuntu@your-vps-ip
git clone https://github.com/your-org/fahin.git && cd fahin

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 3. Set production env variables
cp backend/.env.example backend/.env.production
nano backend/.env.production
# Set: DEBUG=False, SECRET_KEY=<strong-random-key>, ALLOWED_ORIGINS=["https://yourdomain.com"]

# 4. Build and start
cd infra/docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. SSL with Let's Encrypt (after pointing domain to VPS IP)
docker exec fahin_nginx certbot --nginx -d yourdomain.com

# 6. Run migrations
docker exec fahin_api alembic upgrade head
```

---

## Tier 3: Production (Kubernetes + Supabase Cloud)

### Infrastructure Components

```
┌─────────────────────────────────────────────────────┐
│                  Cloud Provider (AWS/GCP)             │
│                                                       │
│  ┌─────────────┐   ┌───────────────────────────────┐ │
│  │  Supabase   │   │      Kubernetes Cluster        │ │
│  │  (managed)  │   │                                │ │
│  │  PostgreSQL │   │  ┌──────┐ ┌──────┐ ┌──────┐  │ │
│  │  Auth       │   │  │ API  │ │ API  │ │ API  │  │ │
│  │  Storage    │   │  │ pod  │ │ pod  │ │ pod  │  │ │
│  └─────────────┘   │  └──────┘ └──────┘ └──────┘  │ │
│                    │  ┌───────────────────────────┐ │ │
│  ┌─────────────┐   │  │   Celery worker pods (3)  │ │ │
│  │    Redis    │   │  └───────────────────────────┘ │ │
│  │  (managed)  │   │  ┌───────────────────────────┐ │ │
│  └─────────────┘   │  │   Flower FL server (1)    │ │ │
│                    │  └───────────────────────────┘ │ │
│                    │  ┌───────────────────────────┐ │ │
│                    │  │   Next.js pods (2)        │ │ │
│                    │  └───────────────────────────┘ │ │
│                    └───────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Supabase Cloud Setup

1. Create project at https://supabase.com/dashboard
2. Run the full schema from `docs/DB_SCHEMA.md` in SQL Editor
3. Enable pgvector extension: `Database → Extensions → vector`
4. Enable Realtime for `outbreak_predictions`, `alert_logs`
5. Configure RLS policies from `docs/DB_SCHEMA.md`
6. Create storage buckets: `fahin-prescriptions`, `fahin-fl-weights`

### Kubernetes Deployment

```bash
# Set your container registry and domain
export REGISTRY=ghcr.io/your-org
export DOMAIN=fahin.yourdomain.com

# Build and push images
docker build -t $REGISTRY/fahin-api:latest -f infra/docker/Dockerfile.backend backend/
docker build -t $REGISTRY/fahin-frontend:latest -f infra/docker/Dockerfile.frontend frontend/
docker push $REGISTRY/fahin-api:latest
docker push $REGISTRY/fahin-frontend:latest

# Create namespace and secrets
kubectl create namespace fahin
kubectl create secret generic fahin-secrets \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  --from-literal=OPENAI_API_KEY=$OPENAI_API_KEY \
  --from-literal=SECRET_KEY=$SECRET_KEY \
  -n fahin

# Apply manifests
kubectl apply -f infra/k8s/ -n fahin

# Check deployment
kubectl get pods -n fahin
kubectl get services -n fahin
```

### Key Kubernetes Manifests (infra/k8s/)

```
infra/k8s/
├── api-deployment.yaml          # FastAPI — 3 replicas
├── api-hpa.yaml                 # Horizontal Pod Autoscaler
├── celery-deployment.yaml       # Celery workers — 3 replicas
├── fl-server-deployment.yaml    # Flower FL server — 1 replica
├── frontend-deployment.yaml     # Next.js — 2 replicas
├── ingress.yaml                 # Nginx ingress + SSL
└── configmap.yaml               # Non-secret configuration
```

---

## Environment Variables Reference

### Backend `.env`

```env
# App
APP_NAME=FAHIN
DEBUG=False
SECRET_KEY=<min-32-char-random-string>

# Database (Supabase)
DATABASE_URL=postgresql+asyncpg://user:pass@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGc...   # anon key
SUPABASE_SERVICE_KEY=eyJhbGc...   # service_role key (keep secret)

# Redis
REDIS_URL=redis://your-redis-host:6379

# AI
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

# External APIs
OPENAQ_API_KEY=...
OPENWEATHER_API_KEY=...

# Thresholds
OUTBREAK_ALERT_THRESHOLD=0.70
ANOMALY_ALERT_THRESHOLD=3.0

# CORS
ALLOWED_ORIGINS=["https://yourdomain.com"]
ALLOWED_HOSTS=["yourdomain.com","www.yourdomain.com"]
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Post-Deployment Checklist

```
[ ] Database migrations applied (alembic upgrade head)
[ ] pgvector extension enabled in Supabase
[ ] RLS policies applied for all tables
[ ] ML models loaded (check /health endpoint)
[ ] Celery workers running (check /api/v1/agents/status)
[ ] FL server accessible on port 8080
[ ] SSL certificate installed and auto-renewing
[ ] Prometheus + Grafana dashboards configured
[ ] Alert webhooks configured for hospitals
[ ] Test symptom submission end-to-end
[ ] Seed medical knowledge base (python backend/app/db/seed_knowledge.py)
```

---

## Monitoring & Observability

```bash
# API health
curl https://yourdomain.com/health

# Agent pipeline status
curl -H "Authorization: Bearer $TOKEN" \
  https://yourdomain.com/api/v1/agents/status

# Celery worker status
celery -A app.core.celery_app inspect active

# View logs (Kubernetes)
kubectl logs -f deployment/fahin-api -n fahin
kubectl logs -f deployment/fahin-celery -n fahin
```

### Grafana Dashboards

Import the pre-built dashboards from `infra/grafana/`:

```
fahin-api-dashboard.json        # API latency, error rates, throughput
fahin-ml-dashboard.json         # Model accuracy drift, inference latency
fahin-fl-dashboard.json         # FL rounds, hospital participation
fahin-outbreak-dashboard.json   # Outbreak predictions over time
```
