# 🖥️ Website Implementation Guide (Admin Portal)

The FAHIN Website is a **Professional Command Center** built for health administrators to monitor city-wide data.

## 🎨 Theme & UI Philosophy
The design preserves the original **Neumorphic / Glassmorphism** aesthetic:
- **Background**: Soft `#EEF0F5`.
- **Cards**: Glass widgets with `backdrop-filter: blur(20px)` and soft neumorphic shadows.
- **Typography**: Sora (Display) & DM Sans (Body).
- **Goal**: A professional, state-of-the-art dashboard that feels like a "command center."

## 🔐 Role: Administrator
The website will exclusively serve the **Admin** role. There will be no public "guest" view or "citizen" view on the web portal (citizens use the Mobile App).

## 🚀 Key Modules
### 1. Unified Risk Heatmap
- An interactive SVG or Canvas map of the city sectors.
- Real-time coloring based on `Anomaly Score` and `Case Density`.
- **Click Actions**: Clicking a sector reveals specific disease trends and top symptoms reported.

### 2. Hospital Readiness Hub
- Track admissions across the network.
- View "Preparation Status" (e.g., "Flu Protocol Active") based on AI alerts sent to hospitals.

### 3. Prescription Audit Trail
- A table of all uploaded prescriptions.
- View digitized text (OCR result) vs. Original image.
- Option to manually flag data for model retraining.

### 4. Alert Center
- Review active outbreaks predicted by the AI.
- Send manual broadcasts to specific city sectors.

## 🛠️ Technology Stack
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS + Vanilla CSS Tokens.
- **State Management**: React Context + SWR (for data fetching).
- **Icons**: Lucide React.
