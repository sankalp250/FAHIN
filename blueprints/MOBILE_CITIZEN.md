# 📱 Mobile Implementation Guide (Citizen App)

The FAHIN Mobile App is the **Primary Entry Point** for citizens to engage with the network and protect their own health.

## 🎨 Theme & UI Philosophy
The mobile app mirrors the Website's aesthetic but optimized for touch:
- **Style**: Soft Neumorphism on buttons and input cards.
- **Goal**: High trust, low friction, and anonymous feel.

## 🔐 Role: Citizen (User)
The app is designed for the general public. No complicated administrative features.

## 🚀 Key Modules
### 1. Symptom Sentinel (Reporting)
- **Fast Track**: A 3-step form to report how the user is feeling.
- **Photo Symptom-ID**:
    - User takes a photo of a physical symptom (e.g., skin rash) or a prescription.
    - **Vision-ID Agent (Gemini)** analyzes the photo and automatically checks symptoms.
    - **Anomaly Detection** flags if the pattern is "New" or a "Known" disease.

### 2. Local Risk View (Heatmap)
- A mobile-optimized view of the city risk levels.
- Shows "Safe" vs "Warning" sectors relative to the user's current city sector.

### 3. Personal Alerts
- Instant notifications if the AI detects a spike in the user's immediate neighborhood.
- "Stay Prepared" reminders based on predicted outbreak peaks.

### 4. Knowledge Hub
- Anonymized advice from the **Medical Intel Agent** based on the diseases currently trending in the user's sector.

## 🛠️ Technology Stack
- **Framework**: React Native + Expo.
- **Navigation**: Expo Router (File-based navigation).
- **Communication**: REST API (Axios).
- **Image Handling**: Expo Image Picker + Firebase/Supabase Storage.
