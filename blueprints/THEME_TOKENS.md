# 🎨 Design System & Theme Tokens

This document preserves the CSS tokens and styling logic for the FAHIN **Neumorphic + Glassmorphism** design system.

## 🌈 Color Palette
```css
:root {
  --bg: #EEF0F5;         /* Soft background */
  --surface: #F8F9FC;    /* Elevated surface */
  --accent: #F59E0B;     /* Amber primary */
  --ink: #1E293B;        /* Deep text */
  --ink-soft: #64748B;   /* Muted text */
  --safe: #10B981;       /* Emerald Green */
  --warn: #F97316;       /* Orange Alert */
  --danger: #EF4444;     /* Red Critical */
}
```

## 💎 Design Utility Classes

### Neumorphic Shadow (Soft Elevation)
```css
.neu {
  box-shadow: 6px 6px 12px #d1d4dc, 
             -6px -6px 12px #ffffff;
}

.neu-inset {
  box-shadow: inset 4px 4px 8px #d1d4dc, 
              inset -4px -4px 8px #ffffff;
}
```

### Glassmorphism (Widgets)
```css
.glass {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
}
```

### Typography
- **Headings**: `Sora`, sans-serif (Bold/Semi-bold)
- **Body**: `DM Sans`, sans-serif

## 🧩 Components Example (Next.js/Tailwind)

### The Primary Button
```tsx
const PillButton = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="rounded-full px-6 py-2.5 font-bold transition-transform active:scale-95 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
  >
    {children}
  </button>
);
```

### The Stats Card (Admin Portal)
```tsx
const StatWidget = ({ label, value, color }) => (
  <div className="neu bg-surface rounded-[32px] p-6 flex flex-col items-center">
    <span className="text-sm font-medium text-ink-soft mb-1">{label}</span>
    <span className={`text-3xl font-bold font-display ${color}`}>{value}</span>
  </div>
);
```
