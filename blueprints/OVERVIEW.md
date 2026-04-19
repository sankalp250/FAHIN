# 🗺️ FAHIN Master Blueprint

This folder contains the **Extreme Detail** plans for the "Start-from-Scratch" overhaul of FAHIN. These documents preserve the system knowledge, design tokens, and architectural decisions.

## 📁 Documentation Roadmap

| File | Purpose |
|---|---|
| [BACKEND_SPECS.md](BACKEND_SPECS.md) | FastAPI architecture, SQLAlchemy V3 Models, and Agentic Orchestration. |
| [WEBSITE_ADMIN.md](WEBSITE_ADMIN.md) | Next.js Admin Portal design, roles, and professional health metrics. |
| [MOBILE_CITIZEN.md](MOBILE_CITIZEN.md) | Expo Citizen App features, Symptom reporting, and Vision-ID flow. |
| [THEME_TOKENS.md](THEME_TOKENS.md) | Preservation of the Neumorphic + Glassmorphism design system. |
| [AI_AGENT_FLOW.md](AI_AGENT_FLOW.md) | Detailed logic for the 5 collaborating agents and Gemini Vision integration. |

---

## 🏗️ Core Architecture (V3)

The system is now a **Unified Sentinel Network**:
- **Data Collection**: Mobile App (Citizen) & Admin Uploads (Professional).
- **Processing**: A single, robust FastAPI backend running the preserved ML models.
- **Visualization**: A professional health dashboard for city administrators.

## 🔒 Preservation Checklist
These items must **NEVER** be deleted during the overhaul:
- `backend/.env`: System credentials (Supabase, Gemini, Sarvam).
- `ml/models/`: The 4 proprietary core models.
- `fahin_trained_models/`: User-provided trained models.
- `blueprints/`: This documentation folder.
