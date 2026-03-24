.PHONY: dev install migrate seed train docker-up docker-down lint

# Start full dev environment
dev:
	$(MAKE) -j3 dev-api dev-frontend dev-celery

dev-api:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-celery:
	cd backend && celery -A app.core.celery_app worker --loglevel=info

# Install all dependencies
install:
	cd backend  && pip install -r requirements.txt
	cd frontend && npm install
	cd mobile   && npm install
	cd ml       && pip install -r requirements.txt

# Database
migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python app/db/seed.py

# Train ML models (after downloading datasets)
train:
	cd ml && python training/train_symptom_embedder.py --data data/raw/disease_symptom/dataset.csv --output models/symptom_embedding/
	cd ml && python training/train_disease_classifier.py --data data/raw/disease_symptom/dataset.csv --output models/disease_classifier/
	cd ml && python training/train_outbreak_forecaster.py --data data/raw/cdc_flu_weekly.csv --output models/outbreak_forecast/
	cd ml && python training/train_anomaly_detector.py --output models/anomaly_detection/
	cd ml && python evaluation/evaluate_all.py

# Docker
docker-up:
	cd infra/docker && docker-compose up -d

docker-down:
	cd infra/docker && docker-compose down

# FL server
fl-server:
	cd backend && python app/services/federated/fl_server.py --rounds 20 --min_clients 2

lint:
	cd backend  && black . && isort . && mypy app/
	cd frontend && npm run lint
