# SkyBound Student Pilot

SkyBound is a professional-grade flight training and aviation management application designed specifically for student pilots. It provides an integrated suite of tools to manage every aspect of flight training, from planning to performance analysis.

## Key Features

- **Integrated Flight Planning**: Build routes with VORs, fixes, and airports with real-time FAA chart overlays.
- **Weather Radar & Briefing**: Live precipitation radar, METAR/TAF integration, and automated weather briefings.
- **Aircraft Management**: Track performance, weight & balance, and checklists for multiple aircraft profiles.
- **Live Flight Tracker**: Track real-time aircraft traffic in your training area.
- **Digital Logbook**: Securely log and analyze your flight hours with automatic certification tracking.
- **Pilot Profile**: Personalize your training goals, track achievements, and sync your data to the cloud.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/UI (Apple-inspired aesthetic)
- **Backend**: Supabase (PostgreSQL, Authentication)
- **Mapping**: Leaflet, OpenStreetMap, FAA Sectional Charts
- **Data APIs**: OpenSky Network (Traffic), RainViewer (Radar), AviationStack (Weather)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev
   ```

3. Build for production:
   ```sh
   npm run build
   ```

## Development

The application is built with performance and aesthetics in mind. It uses dynamic lazy loading for heavy modules and a custom glassmorphism design system.

---
*SkyBound — Elevate your flight training.*
