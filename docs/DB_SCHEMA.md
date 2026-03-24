# 🗄️ FAHIN — Database Schema Reference

**Database:** PostgreSQL 15 via Supabase  
**Extensions required:** `pgvector`, `uuid-ossp`, `pg_cron`

---

## Setup

```sql
-- Run in Supabase SQL editor first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## Tables

### 1. `users`

Stores citizens, doctors, hospital admins, and pharmacists. **No PII beyond role.**

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'doctor', 'hospital_admin', 'pharmacist', 'city_admin')),
    city_sector     VARCHAR(50),                     -- e.g. "Sector-45"
    city            VARCHAR(100) NOT NULL,
    age_group       VARCHAR(20),                     -- "18-30", "31-45", etc. (no exact DOB)
    gender          VARCHAR(10),                     -- optional
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active     TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    
    -- Auth link (Supabase Auth UID)
    auth_id         UUID UNIQUE                      -- links to auth.users.id
);

-- Indexes
CREATE INDEX idx_users_sector ON users(city_sector);
CREATE INDEX idx_users_role ON users(role);
```

---

### 2. `symptom_reports`

Core data table. Citizens submit symptoms here. **No names or exact location.**

```sql
CREATE TABLE symptom_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Symptoms (stored as array, not free text to prevent PII leakage)
    symptoms            TEXT[] NOT NULL,             -- ["fever", "headache", "joint_pain"]
    severity            SMALLINT CHECK (severity BETWEEN 1 AND 10),
    duration_days       SMALLINT,
    
    -- Location (sector level only, never exact coordinates)
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    
    -- Environmental context at time of report
    reported_aqi        FLOAT,
    reported_temp_c     FLOAT,
    reported_humidity   FLOAT,
    
    -- AI processing results
    predicted_disease   VARCHAR(100),
    prediction_confidence FLOAT,
    embedding           VECTOR(768),                 -- symptom embedding for similarity search
    
    -- Metadata
    source              VARCHAR(20) DEFAULT 'mobile' CHECK (source IN ('mobile', 'web', 'api')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ,
    is_processed        BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_symptom_reports_sector ON symptom_reports(city_sector);
CREATE INDEX idx_symptom_reports_created ON symptom_reports(created_at DESC);
CREATE INDEX idx_symptom_reports_disease ON symptom_reports(predicted_disease);
CREATE INDEX idx_symptom_reports_vector ON symptom_reports USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Row Level Security
ALTER TABLE symptom_reports ENABLE ROW LEVEL SECURITY;
-- Citizens can only see their own reports
CREATE POLICY "citizens_own_reports" ON symptom_reports
    FOR SELECT USING (user_id = auth.uid()::uuid);
-- Hospital admins see all reports in their sector
CREATE POLICY "hospital_admins_sector" ON symptom_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_id = auth.uid()::uuid
            AND u.role = 'hospital_admin'
            AND u.city_sector = symptom_reports.city_sector
        )
    );
```

---

### 3. `prescription_records`

Doctor/clinic uploads. OCR-extracted disease and medicine data.

```sql
CREATE TABLE prescription_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Extracted by OCR + NLP (no patient name stored)
    extracted_symptoms  TEXT[],
    extracted_disease   VARCHAR(100),
    extracted_medicines TEXT[],
    
    -- Location context
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    
    -- OCR metadata
    ocr_confidence      FLOAT,
    raw_text_hash       VARCHAR(64),                 -- SHA-256 of raw text (for deduplication)
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMPTZ
);

CREATE INDEX idx_prescriptions_sector ON prescription_records(city_sector);
CREATE INDEX idx_prescriptions_disease ON prescription_records(extracted_disease);
CREATE INDEX idx_prescriptions_created ON prescription_records(created_at DESC);
```

---

### 4. `medicine_sales`

Aggregate pharmacy sales data. **No individual purchase records.**

```sql
CREATE TABLE medicine_sales (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id         UUID REFERENCES users(id),   -- pharmacist user
    
    -- Aggregate only (no individual sale records)
    medicine_name       VARCHAR(200) NOT NULL,
    medicine_category   VARCHAR(50),                 -- "antipyretic", "antiparasitic", etc.
    quantity_sold       INTEGER NOT NULL,
    sale_date           DATE NOT NULL,
    
    -- Location (pharmacy's sector)
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    
    -- Baseline for anomaly detection
    baseline_avg_30d    FLOAT,                       -- rolling 30-day average
    deviation_score     FLOAT,                       -- how far above baseline
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medicine_sales_sector ON medicine_sales(city_sector, sale_date);
CREATE INDEX idx_medicine_sales_medicine ON medicine_sales(medicine_name, sale_date);
CREATE INDEX idx_medicine_sales_date ON medicine_sales(sale_date DESC);

-- Unique constraint: one record per pharmacy per medicine per day
CREATE UNIQUE INDEX idx_medicine_sales_unique 
    ON medicine_sales(pharmacy_id, medicine_name, sale_date);
```

---

### 5. `hospital_stats`

Daily aggregated admission data from hospitals. **Federated — no patient records.**

```sql
CREATE TABLE hospital_stats (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES users(id),
    
    -- Aggregate counts only
    stat_date           DATE NOT NULL,
    disease_category    VARCHAR(100) NOT NULL,        -- "dengue", "flu", "respiratory", etc.
    
    new_admissions      INTEGER DEFAULT 0,
    total_active_cases  INTEGER DEFAULT 0,
    icu_occupied        INTEGER DEFAULT 0,
    discharged_today    INTEGER DEFAULT 0,
    
    -- Location
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(hospital_id, stat_date, disease_category)
);

CREATE INDEX idx_hospital_stats_sector ON hospital_stats(city_sector, stat_date);
CREATE INDEX idx_hospital_stats_disease ON hospital_stats(disease_category, stat_date);
```

---

### 6. `city_sensor_data`

Environmental data by city sector (from OpenAQ API, weather APIs, etc.).

```sql
CREATE TABLE city_sensor_data (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    recorded_at         TIMESTAMPTZ NOT NULL,
    
    -- Air quality
    aqi                 FLOAT,
    pm25                FLOAT,                       -- µg/m³
    pm10                FLOAT,
    no2_ppb             FLOAT,
    
    -- Weather
    temperature_c       FLOAT,
    humidity_pct        FLOAT,
    rainfall_mm         FLOAT,
    wind_speed_kmh      FLOAT,
    
    -- Water quality (if available)
    water_contamination_score FLOAT,
    
    -- Mosquito risk index (computed field)
    mosquito_risk_index FLOAT,                      -- derived: (temp + humidity + rainfall) model
    
    source              VARCHAR(50)                  -- "openaq", "openweather", "manual"
);

CREATE INDEX idx_city_sensor_sector ON city_sensor_data(city_sector, recorded_at DESC);
-- Partition by month for performance
CREATE INDEX idx_city_sensor_time ON city_sensor_data(recorded_at DESC);
```

---

### 7. `outbreak_predictions`

ML model prediction outputs and agent decisions.

```sql
CREATE TABLE outbreak_predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    city_sector         VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    
    -- Disease being predicted
    disease             VARCHAR(100) NOT NULL,
    
    -- Prediction
    prediction_date     DATE NOT NULL,               -- when prediction was made
    predicted_peak_date DATE,                        -- when outbreak is expected to peak
    days_until_peak     SMALLINT,
    
    -- Confidence metrics
    probability         FLOAT NOT NULL,              -- 0.0 to 1.0
    confidence_interval_low  FLOAT,
    confidence_interval_high FLOAT,
    
    -- Contributing model scores
    classifier_score    FLOAT,
    forecast_score      FLOAT,
    anomaly_score       FLOAT,
    
    -- Input signals used
    symptom_report_count    INTEGER,
    pharmacy_spike_detected BOOLEAN DEFAULT FALSE,
    hospital_admission_spike BOOLEAN DEFAULT FALSE,
    env_risk_factor         FLOAT,
    
    -- Status
    alert_sent          BOOLEAN DEFAULT FALSE,
    alert_sent_at       TIMESTAMPTZ,
    outcome             VARCHAR(20),                 -- "confirmed", "false_positive", "pending"
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_sector ON outbreak_predictions(city_sector, prediction_date DESC);
CREATE INDEX idx_predictions_disease ON outbreak_predictions(disease, prediction_date DESC);
CREATE INDEX idx_predictions_prob ON outbreak_predictions(probability DESC) WHERE probability > 0.5;
```

---

### 8. `federated_updates`

Tracks FL model weight submissions from hospital nodes.

```sql
CREATE TABLE federated_updates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID REFERENCES users(id),
    
    -- FL round tracking
    round_number        INTEGER NOT NULL,
    model_type          VARCHAR(50) NOT NULL,        -- "disease_classifier", "outbreak_forecaster", etc.
    
    -- Metrics (no raw weights stored in DB — weights go to object storage)
    weight_storage_key  VARCHAR(255),                -- S3/Supabase storage key
    num_samples_trained INTEGER,
    local_loss          FLOAT,
    local_accuracy      FLOAT,
    
    -- Privacy
    dp_noise_added      BOOLEAN DEFAULT FALSE,
    epsilon_budget_used FLOAT,                       -- differential privacy budget consumed
    
    -- Aggregation status
    aggregated          BOOLEAN DEFAULT FALSE,
    aggregated_at       TIMESTAMPTZ,
    
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_federated_round ON federated_updates(round_number, model_type);
```

---

### 9. `alert_logs`

Audit trail for all sent alerts.

```sql
CREATE TABLE alert_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id       UUID REFERENCES outbreak_predictions(id),
    
    city_sector         VARCHAR(50) NOT NULL,
    disease             VARCHAR(100) NOT NULL,
    alert_type          VARCHAR(30) NOT NULL,        -- "hospital_alert", "authority_alert", "public_alert"
    
    recipients          JSONB,                       -- {"hospitals": ["id1","id2"], "emails": [...]}
    message             TEXT,
    
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status     VARCHAR(20) DEFAULT 'sent'   -- "sent", "delivered", "failed"
);
```

---

### 10. `medical_knowledge` (Vector Store)

Medical knowledge base for RAG pipeline.

```sql
CREATE TABLE medical_knowledge (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    source              VARCHAR(200),                -- "WHO Guidelines 2023", "CDC Dengue Fact Sheet"
    disease_tags        TEXT[],
    
    -- pgvector embedding for semantic search
    embedding           VECTOR(1536),                -- OpenAI text-embedding-3-small dimensions
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_medical_knowledge_vector 
    ON medical_knowledge 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

---

## Views

### `v_sector_daily_summary`

Aggregated view used by dashboard and agents.

```sql
CREATE VIEW v_sector_daily_summary AS
SELECT 
    sr.city_sector,
    sr.city,
    DATE(sr.created_at) AS report_date,
    COUNT(*) AS total_symptom_reports,
    COUNT(DISTINCT sr.predicted_disease) AS distinct_diseases,
    AVG(sr.prediction_confidence) AS avg_confidence,
    ARRAY_AGG(DISTINCT sr.predicted_disease) FILTER (WHERE sr.predicted_disease IS NOT NULL) AS diseases_reported,
    AVG(csd.aqi) AS avg_aqi,
    AVG(csd.humidity_pct) AS avg_humidity,
    AVG(csd.temperature_c) AS avg_temp
FROM symptom_reports sr
LEFT JOIN city_sensor_data csd 
    ON csd.city_sector = sr.city_sector 
    AND DATE(csd.recorded_at) = DATE(sr.created_at)
GROUP BY sr.city_sector, sr.city, DATE(sr.created_at);
```

---

## Supabase Configuration

### Row Level Security (RLS) Summary

| Table | Citizens | Doctors | Hospital Admins | City Admins |
|---|---|---|---|---|
| `symptom_reports` | Own records only | Sector read | Sector read | Full read |
| `prescription_records` | — | Own uploads | Sector read | Full read |
| `medicine_sales` | — | — | Sector read | Full read |
| `hospital_stats` | — | — | Own hospital | Full read |
| `outbreak_predictions` | Read (no PII) | Read | Read | Full CRUD |
| `alert_logs` | — | — | Read | Full CRUD |

### Realtime Subscriptions

Enable realtime on these tables for live dashboard updates:

```sql
-- In Supabase dashboard: Table Editor → Table → Enable Realtime
-- Tables to enable: outbreak_predictions, alert_logs, city_sensor_data
```

### Storage Buckets

```
fahin-prescriptions/   -- Prescription images (private, 30-day TTL)
fahin-fl-weights/      -- Federated learning model weights (private)
fahin-exports/         -- Analytics exports (private)
```

---

## Migrations

All migrations live in `backend/alembic/versions/`.

```bash
# Create new migration
alembic revision --autogenerate -m "add_column_xyz"

# Apply all migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```
