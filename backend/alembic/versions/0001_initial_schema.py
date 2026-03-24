"""Initial FAHIN database schema.

Revision ID: 0001
Create Date: 2025-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # users
    op.create_table("users",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("role",         sa.String(20),  nullable=False),
        sa.Column("city_sector",  sa.String(50)),
        sa.Column("city",         sa.String(100), nullable=False),
        sa.Column("age_group",    sa.String(20)),
        sa.Column("gender",       sa.String(10)),
        sa.Column("auth_id",      postgresql.UUID(as_uuid=True), unique=True),
        sa.Column("is_active",    sa.Boolean(), server_default="true"),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_active",  sa.DateTime(timezone=True)),
    )
    op.create_index("idx_users_sector", "users", ["city_sector"])
    op.create_index("idx_users_role",   "users", ["role"])

    # symptom_reports
    op.create_table("symptom_reports",
        sa.Column("id",                    postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id",               postgresql.UUID(as_uuid=True)),
        sa.Column("symptoms",              postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("severity",              sa.SmallInteger()),
        sa.Column("duration_days",         sa.SmallInteger()),
        sa.Column("city_sector",           sa.String(50), nullable=False),
        sa.Column("city",                  sa.String(100), nullable=False),
        sa.Column("reported_aqi",          sa.Float()),
        sa.Column("reported_temp_c",       sa.Float()),
        sa.Column("reported_humidity",     sa.Float()),
        sa.Column("predicted_disease",     sa.String(100)),
        sa.Column("prediction_confidence", sa.Float()),
        sa.Column("source",                sa.String(20), server_default="mobile"),
        sa.Column("is_processed",          sa.Boolean(), server_default="false"),
        sa.Column("created_at",            sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("processed_at",          sa.DateTime(timezone=True)),
    )
    op.create_index("idx_symptom_sector",  "symptom_reports", ["city_sector"])
    op.create_index("idx_symptom_created", "symptom_reports", ["created_at"])
    op.create_index("idx_symptom_disease", "symptom_reports", ["predicted_disease"])

    # prescription_records
    op.create_table("prescription_records",
        sa.Column("id",                 postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("uploaded_by",        postgresql.UUID(as_uuid=True)),
        sa.Column("extracted_symptoms", postgresql.ARRAY(sa.Text())),
        sa.Column("extracted_disease",  sa.String(100)),
        sa.Column("extracted_medicines",postgresql.ARRAY(sa.Text())),
        sa.Column("city_sector",        sa.String(50), nullable=False),
        sa.Column("city",               sa.String(100), nullable=False),
        sa.Column("ocr_confidence",     sa.Float()),
        sa.Column("created_at",         sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("processed_at",       sa.DateTime(timezone=True)),
    )

    # medicine_sales
    op.create_table("medicine_sales",
        sa.Column("id",               postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("pharmacy_id",      postgresql.UUID(as_uuid=True)),
        sa.Column("medicine_name",    sa.String(200), nullable=False),
        sa.Column("medicine_category",sa.String(50)),
        sa.Column("quantity_sold",    sa.Integer(), nullable=False),
        sa.Column("sale_date",        sa.Date(), nullable=False),
        sa.Column("city_sector",      sa.String(50), nullable=False),
        sa.Column("city",             sa.String(100), nullable=False),
        sa.Column("baseline_avg_30d", sa.Float()),
        sa.Column("deviation_score",  sa.Float()),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_medicine_sales_sector",  "medicine_sales", ["city_sector", "sale_date"])
    op.create_index("idx_medicine_sales_medicine","medicine_sales", ["medicine_name", "sale_date"])

    # hospital_stats
    op.create_table("hospital_stats",
        sa.Column("id",                postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("hospital_id",       postgresql.UUID(as_uuid=True)),
        sa.Column("stat_date",         sa.Date(), nullable=False),
        sa.Column("disease_category",  sa.String(100), nullable=False),
        sa.Column("new_admissions",    sa.Integer(), server_default="0"),
        sa.Column("total_active_cases",sa.Integer(), server_default="0"),
        sa.Column("icu_occupied",      sa.Integer(), server_default="0"),
        sa.Column("discharged_today",  sa.Integer(), server_default="0"),
        sa.Column("city_sector",       sa.String(50), nullable=False),
        sa.Column("city",              sa.String(100), nullable=False),
        sa.Column("created_at",        sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # city_sensor_data
    op.create_table("city_sensor_data",
        sa.Column("id",                       postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("city_sector",              sa.String(50), nullable=False),
        sa.Column("city",                     sa.String(100), nullable=False),
        sa.Column("recorded_at",              sa.DateTime(timezone=True), nullable=False),
        sa.Column("aqi",                      sa.Float()),
        sa.Column("pm25",                     sa.Float()),
        sa.Column("temperature_c",            sa.Float()),
        sa.Column("humidity_pct",             sa.Float()),
        sa.Column("rainfall_mm",              sa.Float()),
        sa.Column("mosquito_risk_index",      sa.Float()),
        sa.Column("source",                   sa.String(50)),
    )

    # outbreak_predictions
    op.create_table("outbreak_predictions",
        sa.Column("id",                      postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("city_sector",             sa.String(50), nullable=False),
        sa.Column("city",                    sa.String(100), nullable=False),
        sa.Column("disease",                 sa.String(100), nullable=False),
        sa.Column("prediction_date",         sa.Date(), nullable=False),
        sa.Column("predicted_peak_date",     sa.Date()),
        sa.Column("days_until_peak",         sa.SmallInteger()),
        sa.Column("probability",             sa.Float(), nullable=False),
        sa.Column("confidence_interval_low", sa.Float()),
        sa.Column("confidence_interval_high",sa.Float()),
        sa.Column("classifier_score",        sa.Float()),
        sa.Column("forecast_score",          sa.Float()),
        sa.Column("anomaly_score",           sa.Float()),
        sa.Column("symptom_report_count",    sa.Integer()),
        sa.Column("pharmacy_spike_detected", sa.Boolean(), server_default="false"),
        sa.Column("hospital_admission_spike",sa.Boolean(), server_default="false"),
        sa.Column("env_risk_factor",         sa.Float()),
        sa.Column("alert_sent",              sa.Boolean(), server_default="false"),
        sa.Column("alert_sent_at",           sa.DateTime(timezone=True)),
        sa.Column("outcome",                 sa.String(20)),
        sa.Column("created_at",              sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_predictions_sector", "outbreak_predictions", ["city_sector", "prediction_date"])

    # federated_updates
    op.create_table("federated_updates",
        sa.Column("id",                postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("hospital_id",       postgresql.UUID(as_uuid=True)),
        sa.Column("round_number",      sa.Integer(), nullable=False),
        sa.Column("model_type",        sa.String(50), nullable=False),
        sa.Column("weight_storage_key",sa.String(255)),
        sa.Column("num_samples_trained",sa.Integer()),
        sa.Column("local_loss",        sa.Float()),
        sa.Column("local_accuracy",    sa.Float()),
        sa.Column("dp_noise_added",    sa.Boolean(), server_default="false"),
        sa.Column("epsilon_budget_used",sa.Float()),
        sa.Column("aggregated",        sa.Boolean(), server_default="false"),
        sa.Column("aggregated_at",     sa.DateTime(timezone=True)),
        sa.Column("submitted_at",      sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # alert_logs
    op.create_table("alert_logs",
        sa.Column("id",              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("prediction_id",   postgresql.UUID(as_uuid=True)),
        sa.Column("city_sector",     sa.String(50), nullable=False),
        sa.Column("disease",         sa.String(100), nullable=False),
        sa.Column("alert_type",      sa.String(30), nullable=False),
        sa.Column("message",         sa.Text()),
        sa.Column("sent_at",         sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("delivery_status", sa.String(20), server_default="sent"),
    )

    # medical_knowledge (vector store)
    op.create_table("medical_knowledge",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title",        sa.Text(), nullable=False),
        sa.Column("content",      sa.Text(), nullable=False),
        sa.Column("source",       sa.String(200)),
        sa.Column("disease_tags", postgresql.ARRAY(sa.Text())),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # Note: vector column and HNSW index added separately via Supabase SQL editor
    # (Alembic does not natively support pgvector column type)


def downgrade() -> None:
    for table in [
        "medical_knowledge","alert_logs","federated_updates","outbreak_predictions",
        "city_sensor_data","hospital_stats","medicine_sales",
        "prescription_records","symptom_reports","users",
    ]:
        op.drop_table(table)
