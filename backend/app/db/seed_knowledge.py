"""
FAHIN — Seed medical knowledge base into pgvector table.
Run: python app/db/seed_knowledge.py
"""
import asyncio
import logging
from app.db.session import AsyncSessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KNOWLEDGE_BASE = [
    {
        "title": "WHO Dengue Fact Sheet",
        "content": "Dengue is a viral infection transmitted by Aedes mosquitoes. Symptoms include high fever (40°C), severe headache, pain behind the eyes, muscle/joint pains, nausea, vomiting, swollen glands, and rash. Severe dengue can cause plasma leaking, fluid accumulation, respiratory distress, severe bleeding, organ impairment. Treatment is supportive — paracetamol for pain/fever, avoid NSAIDs. Peak transmission during and after rainy season with high humidity above 70% and temperature 25-35°C.",
        "source": "WHO Dengue Fact Sheet 2023",
        "disease_tags": ["dengue", "arbovirus"],
    },
    {
        "title": "CDC Influenza Surveillance Guide",
        "content": "Influenza (flu) is a contagious respiratory illness caused by influenza viruses. Symptoms: fever/chills, cough, sore throat, runny/stuffy nose, muscle/body aches, headaches, fatigue. Onset is abrupt (unlike cold). Seasonal peaks in winter months. Spreads via respiratory droplets. Antivirals (oseltamivir) effective if given within 48 hours. Annual vaccination recommended. ILI (influenza-like illness) surveillance: ILI = fever >37.8°C plus cough or sore throat.",
        "source": "CDC FluView Clinical Description",
        "disease_tags": ["influenza", "flu", "respiratory"],
    },
    {
        "title": "WHO Malaria Treatment Guidelines",
        "content": "Malaria is caused by Plasmodium parasites transmitted by female Anopheles mosquitoes. Symptoms appear 10-15 days after bite: fever, chills, sweating, headache, nausea, vomiting, muscle pain. Cyclical fever pattern is characteristic. Diagnosed by blood smear or RDT. Treated with artemisinin-based combination therapy (ACT). P. falciparum most deadly. Risk highest in areas with standing water, high rainfall, temperatures 20-30°C. Mosquito nets and indoor spraying are primary prevention.",
        "source": "WHO Malaria Treatment Guidelines 2023",
        "disease_tags": ["malaria", "plasmodium", "mosquito-borne"],
    },
    {
        "title": "WHO Typhoid Fever Fact Sheet",
        "content": "Typhoid fever is caused by Salmonella enterica serovar Typhi. Transmitted through contaminated food and water. Symptoms: sustained high fever (39-40°C), weakness, stomach pain, headache, diarrhoea or constipation, cough, loss of appetite. Diagnosed by blood culture (gold standard). Treated with antibiotics (fluoroquinolones, azithromycin, cephalosporins). Outbreaks linked to flooding, poor sanitation, contaminated water supply. Water contamination score and rainfall are key environmental risk factors.",
        "source": "WHO Typhoid Fact Sheet",
        "disease_tags": ["typhoid", "salmonella", "waterborne"],
    },
    {
        "title": "Pneumonia and Respiratory Infection Overview",
        "content": "Community-acquired pneumonia (CAP) presents with cough (possibly productive), fever, pleuritic chest pain, dyspnoea. Common pathogens: Streptococcus pneumoniae, Haemophilus influenzae, Mycoplasma. AQI above 150 significantly increases respiratory disease incidence. PM2.5 particles penetrate deep into lungs. Risk groups: elderly, immunocompromised, smokers. Diagnosis via chest X-ray and sputum culture. Treatment: amoxicillin/clavulanate for outpatients.",
        "source": "BTS Guidelines on CAP",
        "disease_tags": ["pneumonia", "respiratory", "LRTI"],
    },
    {
        "title": "Cholera Outbreak Response",
        "content": "Cholera is caused by Vibrio cholerae transmitted via contaminated water/food. Sudden onset of profuse watery diarrhoea (rice-water stool), rapid dehydration. Can be fatal within hours without treatment. Treatment: ORS for mild-moderate, IV fluids for severe. Antibiotics (azithromycin, doxycycline) reduce duration. Outbreaks triggered by floods, broken water infrastructure, poor sanitation. Key indicator: sudden spike in ORS and oral rehydration sales at pharmacies.",
        "source": "WHO Cholera Fact Sheet",
        "disease_tags": ["cholera", "waterborne", "diarrhoeal"],
    },
    {
        "title": "Syndromic Surveillance Methodology",
        "content": "Syndromic surveillance monitors symptom clusters rather than specific diagnoses for early outbreak detection. CDC defines ILI syndrome, GI syndrome, respiratory syndrome, neurological syndrome as key clusters. Statistical methods: CUSUM (cumulative sum control), EARS (Early Aberration Reporting System), SaTScan spatial clustering. Anomaly threshold: typically 2-3 standard deviations above baseline. Pharmacy data (especially antipyretics, antiparasitic, rehydration products) serves as leading indicator 3-7 days before hospital admission spikes.",
        "source": "CDC ESSENCE Syndromic Surveillance",
        "disease_tags": ["surveillance", "syndromic", "methodology"],
    },
    {
        "title": "Dengue Environmental Risk Factors — India",
        "content": "Dengue transmission in Indian cities peaks during post-monsoon season (August-October). Key risk factors: humidity >80%, temperatures 25-35°C, rainfall >50mm/week, standing water (construction sites, water storage, tyres), AQI >100 (urban heat island effect). Aedes aegypti breeds in clean stagnant water within 500m of human habitation. City sectors with rapid construction and inadequate drainage have 3-4x higher dengue risk. Paracetamol and dengue NS1 test kit sales spike 5-7 days before hospital admission peaks.",
        "source": "NIMHANS Dengue Epidemiology Study India",
        "disease_tags": ["dengue", "india", "environmental", "seasonal"],
    },
]


async def seed_knowledge():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import text
        # Check if table exists
        try:
            result = await db.execute(text("SELECT COUNT(*) FROM medical_knowledge"))
            count = result.scalar_one()
            if count > 0:
                logger.info(f"Knowledge base already has {count} entries. Skipping.")
                return
        except Exception:
            logger.warning("medical_knowledge table not found — run migrations first")
            return

        for item in KNOWLEDGE_BASE:
            await db.execute(
                text("""
                    INSERT INTO medical_knowledge (title, content, source, disease_tags)
                    VALUES (:title, :content, :source, :tags)
                    ON CONFLICT DO NOTHING
                """),
                {
                    "title": item["title"],
                    "content": item["content"],
                    "source": item["source"],
                    "tags": item["disease_tags"],
                }
            )

        await db.commit()
        logger.info(f"✅ Seeded {len(KNOWLEDGE_BASE)} medical knowledge entries")
        logger.info("NOTE: Run embedding generation to populate the vector column:")
        logger.info("  python app/db/generate_embeddings.py")


if __name__ == "__main__":
    asyncio.run(seed_knowledge())
