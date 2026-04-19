# ⚙️ Backend Specifications (V3)

The FAHIN Backend is a high-performance **FastAPI** application serving as the intelligence hub for both the Website and Mobile app.

## 🔗 Repository Structure
```
backend/
├── app/
│   ├── api/v1/        # Clean, versioned REST endpoints
│   ├── core/          # Security (JWT), Config (Pydantic), Auth
│   ├── db/            # SQLAlchemy Async Sessions
│   ├── models/        # V3 Clean Database Models
│   ├── services/      # Business logic (Agents, ML, OCR)
│   └── main.py        # Entry point with Lifespan model loading
├── .env               # [PRESERVED]
└── requirements.txt   # Core dependencies
```

## 🗄️ Database Models (SQLAlchemy)
The schema has been flattened to remove complexity:
- **User**: Unified table with `role` (Admin/Citizen).
- **SymptomReport**: Stores symptom lists, severity, and AI identification results.
- **Prescription**: Stores OCR results and photo URLs.
- **OutbreakAlert**: Stores predicted outbreak events for the heatmap.

## 🤖 Internal Intelligence Flow
1. **Request**: Citizen reports symptoms via Mobile App.
2. **Vision/OCR**: If photo is provided, **Gemini 1.5** extracts textual symptoms.
3. **Identification**:
    - **Anomaly Model** checks for "Unknown Patterns".
    - **Classification Model** selects the most likely "Old Disease".
4. **Persistence**: Data is saved to `reports` table.
5. **Aggregation**: **Outbreak Agent** runs nightly to trigger alerts if case density in a sector exceeds the 70% threshold.

## 🛡️ API Endpoints Priority
| Endpoint | Method | Role | Purpose |
|---|---|---|---|
| `/auth/register` | POST | ALL | Create account |
| `/auth/login` | POST | ALL | Authenticate & get JWT |
| `/symptoms/report` | POST | Citizen | Submit symptom data/photo |
| `/dashboard/metrics`| GET | Admin | Stats for the website |
| `/alerts/local` | GET | Citizen | Get risks for current sector |
| `/prescriptions/` | POST | ALL | Integrated OCR upload |
