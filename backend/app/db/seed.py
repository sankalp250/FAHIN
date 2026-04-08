"""
FAHIN — Demo data seeder.
Run: python app/db/seed.py
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.symptom_report import SymptomReport
from app.models.outbreak_prediction import OutbreakPrediction
from app.models.alert_log import AlertLog
from app.models.medicine_sale import MedicineSale
import random

SECTORS  = ["Sector-45","Sector-32","Sector-17","Sector-21","Sector-8","Sector-3"]
DISEASES = ["Dengue","Influenza","Malaria","Typhoid","Respiratory","Unknown"]
SYMPTOMS_MAP = {
    "Dengue":      ["fever","joint_pain","headache","rash","pain_behind_the_eyes"],
    "Influenza":   ["fever","cough","sore_throat","body_aches","fatigue"],
    "Malaria":     ["fever","chills","sweating","headache","nausea"],
    "Typhoid":     ["fever","abdominal_pain","headache","loss_of_appetite"],
    "Respiratory": ["cough","breathlessness","chest_pain","phlegm"],
    "Unknown":     ["fever","unusual_fatigue","muscle_weakness"],
}

async def seed():
    async with AsyncSessionLocal() as db:
        # Users
        users = []
        for role, city_sector in [("citizen","Sector-45"),("hospital_admin","Sector-32"),("pharmacist","Sector-45"),("city_admin","Sector-45")]:
            u = User(role=role, city="Gurugram", city_sector=city_sector, age_group="25-40")
            db.add(u)
            users.append(u)
        await db.flush()

        # Symptom reports — last 14 days
        citizen = users[0]
        for i in range(50):
            sector = random.choice(SECTORS)
            disease = random.choice(DISEASES)
            syms = random.sample(SYMPTOMS_MAP[disease], k=min(random.randint(2,4), len(SYMPTOMS_MAP[disease])))
            sr = SymptomReport(
                user_id=citizen.id, symptoms=syms, severity=random.randint(3,8),
                duration_days=random.randint(1,5), city_sector=sector, city="Gurugram",
                predicted_disease=disease, prediction_confidence=round(random.uniform(0.65,0.95),2),
                source="mobile", is_processed=True,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0,14)),
            )
            db.add(sr)

        # Predictions
        for sector, disease, prob, peak_days in [
            ("Sector-45","Dengue",0.84,5), ("Sector-32","Influenza",0.67,8),
            ("Sector-17","Unknown",0.72,3), ("Sector-21","Malaria",0.51,12),
        ]:
            pred = OutbreakPrediction(
                city_sector=sector, city="Gurugram", disease=disease, probability=prob,
                prediction_date=date.today(), days_until_peak=peak_days,
                classifier_score=round(prob+random.uniform(-0.05,0.05),2),
                alert_sent=prob>=0.7, alert_sent_at=datetime.utcnow() if prob>=0.7 else None,
            )
            db.add(pred)
            if prob >= 0.7:
                db.add(AlertLog(city_sector=sector, disease=disease, alert_type="hospital_alert",
                                message=f"⚠️ {disease} outbreak predicted in {sector}. Probability: {prob:.0%}"))

        # Medicine sales
        for medicine, category, sector, qty_range in [
            ("Paracetamol 500mg","Antipyretic","Sector-45",(300,500)),
            ("Dengue Test Kit","Diagnostics","Sector-45",(60,120)),
            ("ORS Sachets","Rehydration","Sector-32",(200,400)),
            ("Chloroquine","Antimalarial","Sector-21",(80,200)),
        ]:
            for day in range(7):
                base = random.randint(*qty_range) // (1 if day < 3 else 3)
                db.add(MedicineSale(
                    medicine_name=medicine, medicine_category=category,
                    quantity_sold=random.randint(*qty_range) if day < 3 else base,
                    sale_date=date.today()-timedelta(days=day), city_sector=sector, city="Gurugram",
                    baseline_avg_30d=float(base), deviation_score=round(random.uniform(1.0,4.0),2),
                ))

        await db.commit()
        print("✅ Demo data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
