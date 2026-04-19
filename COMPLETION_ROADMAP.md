# FAHIN: Platform Completion Roadmap

This document outlines the remaining steps required to bring the FAHIN platform to a production-ready state and jump to the mobile app development.

## 1. Web Platform Finalization

### Identity & Access (Auth)
- [ ] **Admin Authentication**: Secure the `/dashboard`, `/settings`, and `/alerts` pages with JWT-based auth.
- [ ] **Hospital Role**: Implement a dedicated login for medical staff to access `/hospitals` with write permissions for "Local Reports".
- [ ] **Citizen Portal (Web)**: Optional light-weight version of the mobile app for citizens who prefer web.

### Notification Service Integration
- [ ] **WhatsApp Business API**: Connect the `/alerts/broadcast` endpoint to a real WhatsApp gateway (e.g., Twilio or Sarvam).
- [ ] **Email Alerts**: Integrate with Resend/SendGrid for daily city-wide health reports to officials.

### Advanced Analytics
- [ ] **Predictive Modeling**: Move from mock growth percentages to actual LSTM/BERT predictions based on historical trend data.
- [ ] **Weather Correlation**: Fine-tune the "Risk Factor" logic to ingest real-time humidity/temp data from OpenWeatherMap.

---

## 2. Mobile App (Citizen)

### High-Level Features
- [ ] **Prescription Digitization**: A camera-first UI that allows citizens to snap a photo of their prescription for AI-powered OCR.
- [ ] **Symptom Tracker**: A simple "How do you feel?" flow that feeds data directly into the central anomaly detection engine.
- [ ] **Proximity Alerts**: Push notifications when a citizen enters a sector with a "Critical" or "High" risk rating.

### Tech Stack
- **Framework**: React Native (Expo)
- **State Management**: TanStack Query (matching the web's SWR logic)
- **Native Modules**: `expo-camera`, `expo-notifications`, `expo-location`.

---

## 3. Deployment & Scaling

### Database
- [ ] Migrate from local SQLite/Postgres to a managed instance (Supabase/AWS RDS).
- [ ] Implement database backups and point-in-time recovery.

### API
- [ ] Host the FastAPI backend on Azure Container Apps or AWS App Runner.
- [ ] Set up a CDN (Vercel/Cloudflare) for the frontend to ensure global low latency.

---

## Status: RECENT STABLE CHANGES
> [!NOTE]
> The system now supports **Dynamic Sector Management** and has a dedicated **Hospital Portal**. 
> The **Settings** page is fully reactive and persists all configuration states to the backend.
