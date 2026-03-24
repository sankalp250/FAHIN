# 📡 FAHIN — API Reference

**Base URL:** `http://localhost:8000/api/v1`  
**Auth:** Bearer JWT token in `Authorization` header  
**Interactive docs:** `http://localhost:8000/docs`

---

## Authentication

### POST `/auth/login`
```json
Request:
{
  "email": "user@hospital.com",
  "password": "password123"
}

Response 200:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "role": "hospital_admin",
    "city_sector": "Sector-45"
  }
}
```

---

## Symptoms

### POST `/symptoms/report`
Submit a citizen symptom report. Processed async by LangChain agents.

```json
Request:
{
  "symptoms": ["fever", "headache", "joint_pain", "rash"],
  "severity": 7,
  "duration_days": 2,
  "city_sector": "Sector-45",
  "city": "Gurugram",
  "reported_aqi": 142.5,
  "reported_temp_c": 34.2,
  "reported_humidity": 88.5
}

Response 201:
{
  "id": "uuid",
  "symptoms": ["fever", "headache", "joint_pain", "rash"],
  "city_sector": "Sector-45",
  "predicted_disease": null,
  "prediction_confidence": null,
  "is_processed": false,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### GET `/symptoms/sector/{sector_id}?days=7`
Get recent symptom reports for a sector. (Hospital admin only)

```json
Response 200:
[
  {
    "id": "uuid",
    "symptoms": ["fever", "joint_pain"],
    "city_sector": "Sector-45",
    "predicted_disease": "Dengue",
    "prediction_confidence": 0.82,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### GET `/symptoms/trends?city=Gurugram&days=14`
City-wide symptom trend aggregates.

```json
Response 200:
[
  {
    "city_sector": "Sector-45",
    "report_date": "2025-01-15",
    "total_reports": 142,
    "predicted_disease": "Dengue",
    "avg_confidence": 0.79
  }
]
```

---

## Predictions

### GET `/predictions/sector/{sector_id}`
Get the latest outbreak prediction for a sector.

```json
Response 200:
{
  "id": "uuid",
  "city_sector": "Sector-45",
  "disease": "Dengue",
  "probability": 0.84,
  "predicted_peak_date": "2025-01-20",
  "days_until_peak": 5,
  "confidence_interval_low": 0.71,
  "confidence_interval_high": 0.93,
  "classifier_score": 0.88,
  "forecast_score": 0.81,
  "anomaly_score": 0.62,
  "alert_sent": true,
  "prediction_date": "2025-01-15"
}
```

### GET `/predictions/city?city=Gurugram`
All active predictions across the city.

### POST `/predictions/run`
Manually trigger the prediction pipeline for a sector. (Admin only)

```json
Request:
{
  "sector": "Sector-45",
  "city": "Gurugram"
}
```

---

## Dashboard

### GET `/dashboard/city-heatmap?city=Gurugram`
Returns risk data for all sectors, used to render the heatmap.

```json
Response 200:
{
  "city": "Gurugram",
  "sectors": [
    {
      "sector": "Sector-45",
      "latitude": 28.4595,
      "longitude": 77.0266,
      "risk_score": 0.84,
      "top_disease": "Dengue",
      "report_count_7d": 312,
      "trend": "rising"
    }
  ],
  "generated_at": "2025-01-15T10:30:00Z"
}
```

### GET `/dashboard/city-stats?city=Gurugram`
Aggregate statistics for the city dashboard header.

```json
Response 200:
{
  "total_reports_today": 1842,
  "active_alerts": 3,
  "high_risk_sectors": 2,
  "models_online": 4,
  "fl_round_current": 14,
  "fl_hospitals_participating": 7
}
```

---

## Pharmacy

### POST `/pharmacy/sales`
Submit daily medicine sales aggregate. (Pharmacist only)

```json
Request:
{
  "medicine_name": "Paracetamol 500mg",
  "medicine_category": "antipyretic",
  "quantity_sold": 480,
  "sale_date": "2025-01-15",
  "city_sector": "Sector-45",
  "city": "Gurugram"
}

Response 201:
{
  "id": "uuid",
  "medicine_name": "Paracetamol 500mg",
  "quantity_sold": 480,
  "baseline_avg_30d": 120.5,
  "deviation_score": 2.98,
  "created_at": "2025-01-15T18:00:00Z"
}
```

---

## Hospitals

### POST `/hospitals/stats`
Submit daily aggregated hospital admissions. (Hospital admin only, no patient records)

```json
Request:
{
  "stat_date": "2025-01-15",
  "disease_category": "dengue",
  "new_admissions": 23,
  "total_active_cases": 87,
  "icu_occupied": 8,
  "discharged_today": 12,
  "city_sector": "Sector-45",
  "city": "Gurugram"
}
```

---

## Alerts

### GET `/alerts/active?city=Gurugram`
List all active outbreak alerts.

```json
Response 200:
[
  {
    "id": "uuid",
    "city_sector": "Sector-45",
    "disease": "Dengue",
    "probability": 0.84,
    "days_until_peak": 5,
    "alert_type": "hospital_alert",
    "sent_at": "2025-01-15T08:30:00Z",
    "delivery_status": "delivered"
  }
]
```

---

## Prescriptions

### POST `/prescriptions/upload`
Upload a prescription image. OCR extracts disease/medicine data.

```
Content-Type: multipart/form-data

Fields:
  image: <file>  (JPG, PNG, PDF — max 10MB)
  city_sector: "Sector-45"
  city: "Gurugram"

Response 202:
{
  "id": "uuid",
  "status": "processing",
  "message": "Prescription received. OCR processing in background."
}
```

---

## Federated Learning

### POST `/federated/submit-weights`
Hospital submits local model weight updates. (Hospital auth only)

```json
Request:
{
  "round_number": 14,
  "model_type": "disease_classifier",
  "weight_storage_key": "fl-weights/hospital_uuid/round_14.npz",
  "num_samples_trained": 1250,
  "local_loss": 0.182,
  "local_accuracy": 0.934,
  "dp_noise_added": true,
  "epsilon_budget_used": 0.05
}
```

### GET `/federated/rounds/current`
Get information about the current FL round.

```json
Response 200:
{
  "round_number": 14,
  "model_type": "disease_classifier",
  "started_at": "2025-01-15T06:00:00Z",
  "min_clients": 3,
  "clients_submitted": 5,
  "status": "in_progress"
}
```

---

## Agents

### GET `/agents/status`
Health check for all LangChain agents.

```json
Response 200:
{
  "agents": [
    {
      "name": "PrivacyGuardian",
      "status": "active",
      "processed_today": 1842,
      "last_run": "2025-01-15T10:29:45Z",
      "error_rate_pct": 0.0
    },
    {
      "name": "OutbreakPrediction",
      "status": "active",
      "processed_today": 210,
      "last_run": "2025-01-15T10:28:12Z",
      "error_rate_pct": 0.5
    }
  ],
  "pipeline_healthy": true
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

| Status Code | Meaning |
|---|---|
| 400 | Invalid request body |
| 401 | Missing or invalid JWT |
| 403 | Insufficient permissions for this role |
| 404 | Resource not found |
| 422 | Validation error (see `detail` array) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
