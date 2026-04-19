# 🧠 FAHIN — Federated Agentic Health Intelligence Network

![FAHIN Banner](docs/diagrams/banner.png)

**City-wide AI disease outbreak detection — simplified for the future.**

---

## 📌 Vision: The Dual-Sentinel System
FAHIN is a privacy-preserving intelligence network designed to detect disease outbreaks 7-14 days in advance. 

The new architecture focuses on a **Dual-Sentinel** approach:
1.  **FAHIN Mobile (Sentinel App)**: The eyes of the network. Citizens report symptoms and upload symptom photos for instant AI identification (Old vs. New Disease).
2.  **FAHIN Web (Control Center)**: The brain of the network. Administrators oversee city-wide risk heatmaps, manage hospital readiness, and track agentic pipeline health.

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🤖 **Agentic Orchestrator** | 5 AI agents collaborating via LangChain to analyze health signals. |
| 📸 **Vision-ID** | Gemini 1.5 Flash vision analysis to identify disease patterns from photos. |
| 🔒 **Privacy-First** | All data is anonymized. Personal IDs never leave the device. |
| 🛡️ **ML Models** | 4 proprietary models (Classification, Anomaly, Forecast, Embedding). |
| ⚡ **Alert Hub** | Multi-channel notifications for predicted outbreak peaks. |

## 📁 Project Structure (Post-Overhaul)

```
FAHIN/
├── 📂 backend/               # Unified FastAPI Backend
├── 📂 website/               # Next.js Admin Portal
├── 📂 mobile/                # Expo/React Native Citizen App
├── 📂 ml/models/             # PRESERVED Core AI Models
└── 📂 fahin_trained_models/  # PRESERVED User-provided Models
```

## 🛠️ Quick Start (V3)

1.  **Install dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    npm install --prefix website
    npm install --prefix mobile
    ```
2.  **Environment**: 
    Keep your `.env` files in `backend/` and `website/` (preserved from previous version).
3.  **Run Services**:
    - Backend: `uvicorn app.main:app`
    - Website: `npm run dev`
    - Mobile: `npx expo start`

---

Built with ❤️ for resilient cities.
