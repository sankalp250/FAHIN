# ✅ FAHIN Project Task List

This document tracks the progress of the FAHIN Start-from-Scratch Overhaul.

## 🏁 Phase 1: Cleanup & Documentation
- [x] Update `README.md` with new project goals
- [x] Purge `backend` (excluding `.env`, `ml/models`, `fahin_trained_models`)
- [x] Purge `frontend` (excluding `.env.local`)
- [x] Purge `mobile` (re-initialize clean)
- [x] Wipe Supabase database tables (Truncate)
- [x] Create Extreme Detail Blueprints in `blueprints/` folder

## 🏗️ Phase 2: Unified Backend Construction (FastAPI)
- [x] Scaffold project structure (`api/`, `core/`, `agents/`, `services/`)
- [x] Implement V3 Database Models (SQLAlchemy)
- [x] Implement Auth (Admin/Citizen roles)
- [x] Integrate ML Model loading logic (ModelRegistry)
- [ ] Build AI Agent Orchestrator (Vision + Pattern + Forex)
- [ ] Implement V3 REST Endpoints (Auth, Symptoms, Alerts, Dashboard)

## 🖥️ Phase 3: Admin Website (Next.js)
- [ ] Initialize clean Next.js 14 project
- [ ] Re-implement Neumorphic / Glassmorphism Design System
- [ ] Build Master Health Dashboard (Heatmap + Outbreak Alerts)
- [ ] Build Global Records View (OCR & Photo Audit)

## 📱 Phase 4: Citizen Mobile App (Expo)
- [ ] Initialize clean Expo project
- [ ] Build Symptom Reporting Flow
- [ ] Build Photo Identification feature (Gemini Vision + ML)
- [ ] Build Local Risk / Alert View

## 🧪 Phase 5: Verification & Audit
- [ ] End-to-end integration test: Mobile -> Backend -> Website
- [ ] Audit every interactive element for functional correctness
- [ ] Verify "No Dummy Data" requirement is met across all roles
