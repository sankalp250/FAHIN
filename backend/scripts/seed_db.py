import asyncio
import uuid
from datetime import datetime, timedelta
from app.db.session import AsyncSessionLocal
from app.models.v3_models import User, SymptomReport, Prescription, OutbreakAlert, Sector, SystemConfig, Hospital

async def seed_db():
    print("Seeding database with realistic records...")
    async with AsyncSessionLocal() as session:
        # 0. Clear existing data (Optional, but good for clean seed)
        # 1. Create Admins and Citizens
        admin_id = uuid.uuid4()
        citizen_id = uuid.uuid4()
        
        admin = User(
            id=admin_id,
            email="admin@fahin.org",
            hashed_password="fake_hash", 
            role="admin",
            city="Metropolis"
        )
        
        citizen = User(
            id=citizen_id,
            email="citizen@fahin.org",
            hashed_password="fake_hash",
            role="citizen",
            city="Metropolis",
            sector="Sector 2"
        )
        
        session.add_all([admin, citizen])
        
        # 2. SECTORS
        sector_names = ["North Salt Lake", "Sector 2", "Harbor District", "Tech Park", "Salt Lake Central", "South Salt Lake"]
        sectors = [Sector(name=name, city="Kolkata") for name in sector_names]
        session.add_all(sectors)

        # 3. Create Symptom Reports for different sectors
        reports = []
        
        # Create a spike in Sector 2 (Critical)
        for i in range(15):
            reports.append(SymptomReport(
                user_id=citizen_id,
                symptoms=["Fever", "Cough", "Breathlessness"],
                severity=0.8,
                duration_days=3,
                city="Kolkata",
                city_sector="Sector 2",
                identified_disease="Unknown Viral Pattern",
                is_anomaly=True,
                anomaly_score=85.0,
                created_at=datetime.utcnow() - timedelta(hours=i*2)
            ))
            
        # Create some safe reports
        for s in sector_names:
            if s == "Sector 2": continue
            reports.append(SymptomReport(
                user_id=citizen_id,
                symptoms=["Mild Cold"],
                severity=0.2,
                duration_days=1,
                city="Kolkata",
                city_sector=s,
                identified_disease="Common Cold",
                is_anomaly=False,
                anomaly_score=5.0
            ))
            
        session.add_all(reports)
        
        # 4. Create Prescriptions
        prescriptions = [
            Prescription(
                user_id=citizen_id,
                photo_url="https://example.com/rx1.jpg",
                ocr_text="Amoxicillin 500mg - 1 tab tid. Take after food.",
                processed=True
            ),
            Prescription(
                user_id=citizen_id,
                photo_url="https://example.com/rx2.jpg",
                ocr_text="Paracetamol 650mg - 1 tab every 6 hours for fever.",
                processed=True
            )
        ]
        session.add_all(prescriptions)
        
        # 5. Create Hospitals
        hospitals = [
            Hospital(
                name="City General Hospital",
                city="Kolkata",
                sector="North Salt Lake",
                icu_beds_total=120,
                icu_beds_available=45,
                oxygen_status=88.5,
                phone="+91 98765 43210"
            ),
            Hospital(
                name="Metro Health Clinic",
                city="Kolkata",
                sector="Sector 2",
                icu_beds_total=40,
                icu_beds_available=2,
                oxygen_status=35.0,
                phone="+91 98765 11111"
            ),
            Hospital(
                name="Salt Lake Medical Center",
                city="Kolkata",
                sector="Salt Lake Central",
                icu_beds_total=200,
                icu_beds_available=150,
                oxygen_status=95.0,
                phone="+91 98765 22222"
            )
        ]
        session.add_all(hospitals)

        # 6. Create System Config
        config = SystemConfig(
            active_city="Kolkata",
            weather_enabled=True,
            anomaly_sensitivity=70,
            risk_delta_threshold=85
        )
        session.add(config)

        # 7. Create Outbreak Alerts
        alerts = [
            OutbreakAlert(
                city="Kolkata",
                city_sector="Sector 2",
                disease="Pathogen Alpha",
                risk_score=0.92,
                message="Critical spike in respiratory distress detected in Sector 2.",
                expires_at=datetime.utcnow() + timedelta(days=7)
            ),
            OutbreakAlert(
                city="Kolkata",
                city_sector="Harbor District",
                disease="Influenza Cluster",
                risk_score=0.65,
                message="Moderate increase in flu-like symptoms in Harbor District.",
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
        ]
        session.add_all(alerts)
        
        await session.commit()
    print("Database seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_db())
