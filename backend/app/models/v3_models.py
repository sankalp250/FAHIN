from sqlalchemy import Column, String, Float, Integer, JSON, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="citizen") # "admin" or "citizen"
    city = Column(String)
    sector = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("SymptomReport", back_populates="user")
    prescriptions = relationship("Prescription", back_populates="user")

class SymptomReport(Base):
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    symptoms = Column(JSON) # List of symptom strings
    severity = Column(Float)
    duration_days = Column(Integer)
    city = Column(String, default="Kolkata")
    city_sector = Column(String)
    identified_disease = Column(String) # Prediction result
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float)
    photo_url = Column(String, nullable=True) # If uploaded from mobile
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    photo_url = Column(String)
    ocr_text = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="prescriptions")

class OutbreakAlert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city = Column(String, default="Kolkata")
    city_sector = Column(String)
    disease = Column(String)
    risk_score = Column(Float)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

class Sector(Base):
    __tablename__ = "sectors"
    
    id = Column(Integer, primary_key=True)
    city = Column(String, default="Kolkata")
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    city = Column(String, default="Kolkata")
    sector = Column(String)
    icu_beds_total = Column(Integer, default=50)
    icu_beds_available = Column(Integer, default=50)
    oxygen_status = Column(Float, default=100.0) # Percentage 0-100
    phone = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemConfig(Base):
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True)
    active_city = Column(String, default="Kolkata")
    active_models = Column(JSON, default={
        "BERT": True,
        "LSTM": True,
        "GPT": False,
        "Gemini": True
    })
    weather_enabled = Column(Boolean, default=True)
    anomaly_sensitivity = Column(Integer, default=70)
    risk_delta_threshold = Column(Integer, default=85)
    notifications_sync = Column(JSON, default={
        "outbreak_alerts": True,
        "daily_stats": True,
        "system_health": False,
        "new_reports": True
    })
    webhook_url = Column(String, default="https://hooks.fahin.ai/outbreaks")
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
