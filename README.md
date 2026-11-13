# SENTINEL AI

> **Your Room. Your Safety. Your AI Guardian.**

SENTINEL AI is a production-grade, software-only indoor safety monitoring platform that safeguards indoor spaces without requiring external IoT microcontrollers, Arduino, or ESP32 hardware. By converting everyday commodity devices (laptops, webcams, and microphones) into an intelligent sensory grid, SENTINEL AI uses multi-modal computer vision, acoustic signature recognition, and an intelligent risk convergence engine to detect indoor emergencies and alert residents instantly.

---

## 🌟 Key Features

### 1. Live Optical Computer Vision
* **Real-Time Flame & Fire Detection:** Uses dual color space segmentation ($\text{YCrCb} + \text{HSV}$), dynamic flame flicker variance analysis ($5-15\text{ Hz}$), and non-convex contour irregularity to detect active flames while rejecting static orange/red false positives.
* **Smoke Obscuration Detection:** Evaluates desaturation ($S \le 65$), luminance thresholds, and local Laplacian edge attenuation to detect smoke plumes.
* **Occupant Presence Counting:** Tracks human silhouettes using vertical aspect ratios, anthropomorphic area thresholds, and head-shoulder profiles.
* **Unusual Indoor Movement:** Tracks sudden velocity jumps and large area disturbances using MOG2 foreground subtraction.
* **Live HUD Overlay:** Real-time bounding boxes with detection categories and confidence scores directly on the canvas.

### 2. Acoustic Intelligence & Audio Monitoring
* **Glass Shattering Detection:** High-frequency resonant burst identification ($>4500\text{ Hz}$), zero-crossing rate analysis, and sharp transient attack decay.
* **Smoke & Fire Alarm Recognition:** Detects pure tonal frequencies ($3000-3300\text{ Hz}$) matching UL 217 / NFPA 72 T-3 patterns with low spectral flatness.
* **Human Distress & Screaming:** Formant energy tracking in the $1200-3200\text{ Hz}$ vocal range with high pitch variability.
* **Sudden Loud Impacts:** Low-frequency broadband shockwave detection ($<450\text{ Hz}$) with rapid energy decay.
* **Real-Time Audio Visualizer:** Web Audio API oscilloscope and frequency spectrum analyzer.
* **Privacy Guarantee:** $100\%$ ephemeral in-memory processing. Zero raw audio recordings stored on disk.

### 3. Intelligent Risk Convergence Engine
* **Multi-Modal Evidence Fusion:** Combines visual, acoustic, and atmospheric data into a normalized Threat Index ($0-100$).
* **Temporal Verification:** Sliding time window verification requires multi-frame persistence to eliminate single-frame spurious glitches.
* **Hierarchical Threat Levels:**
  * `NORMAL` ($0-34$): Standard ambient baseline.
  * `WARNING` ($35-64$): Single anomaly, isolated movement spike, or minor haze.
  * `HIGH RISK` ($65-89$): Unconfirmed flame, confirmed alarm audio, or glass break + motion.
  * `CRITICAL` ($90-100$): Flame + alarm audio convergence, persistent fire, or flashover conditions.

### 4. Environmental Simulation Mode
* **Hardware-Free Operation:** Synthetic temperature (°C / °F), relative humidity (%), particulate smoke (PPM), and combustible gas/CO (PPM).
* **Presets:** Normal Room, Kitchen Cooking Heat, Smoldering Fire, Flashover / Active Fire, Combustible Gas Leak.
* **Strict Transparency:** Every simulated reading is explicitly labeled with `is_simulated: true`.

### 5. Critical Emergency Alerting
* **Full-Screen Emergency Takeover:** High-visibility pulsing crimson beacon.
* **Browser Emergency Siren:** Dual-tone frequency-modulated wail synthesized via Web Audio API.
* **Automated Dispatch Integration:** Ready for Firebase Cloud Messaging (FCM) and SMS gateways.
* **Alert Audit History:** Filterable table with acknowledgment status and timestamps.

### 6. Interactive Testing & Verification Lab
* Integrated diagnostic test suite verifying:
  1. Fire flame visual detection
  2. Smoke plume CV detection
  3. Glass breaking acoustic classifier
  4. Alarm sound (3100 Hz T-3) classifier
  5. Human detection pipeline
  6. Camera permission denial fallback
  7. Microphone permission denial fallback
  8. Network resilience and offline mode

---

## 🏗️ Project Architecture

```
sentinel-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_stream.py      # Live frame & audio chunk analysis + WebSockets
│   │   │   ├── routes_alerts.py      # Alert listing, acknowledgment, contacts
│   │   │   ├── routes_simulation.py  # Synthetic environmental sensors
│   │   │   ├── routes_testing.py     # Diagnostic verification endpoints
│   │   │   └── routes_auth.py        # Operator authentication
│   │   ├── audio/
│   │   │   ├── features.py           # FFT, Centroid, Rolloff, ZCR, Flatness
│   │   │   └── classifier.py         # Acoustic hazard classifier & test signal synth
│   │   ├── engine/
│   │   │   ├── risk_engine.py        # Multi-modal fusion & temporal verification
│   │   │   ├── alert_manager.py      # Deduplication, cooldowns, dispatch
│   │   │   └── simulation.py         # Environmental sensor simulator
│   │   ├── vision/
│   │   │   ├── fire_smoke.py         # YCrCb/HSV flame flicker & smoke detector
│   │   │   ├── human_motion.py       # Silhouette & MOG2 motion tracking
│   │   │   └── detector.py           # Unified vision orchestrator
│   │   ├── config.py                 # Application configuration & thresholds
│   │   ├── database.py               # SQLite / PostgreSQL persistence layer
│   │   ├── schemas.py                # Pydantic validation schemas
│   │   └── main.py                   # FastAPI server entrypoint
│   ├── requirements.txt
│   └── run_backend.py                # Server runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header, status badge, kill switch
│   │   │   ├── LiveCameraCard.jsx    # Webcam feed & CV bounding box canvas
│   │   │   ├── AudioMonitorCard.jsx  # Oscilloscope & acoustic classifier
│   │   │   ├── RiskEngineCard.jsx    # Convergent Threat Index & hazards
│   │   │   ├── EnvironmentalSimulationCard.jsx # Gauges & scenario presets
│   │   │   ├── CriticalAlertModal.jsx # Pulsing siren modal & dispatch
│   │   │   ├── AlertHistoryTab.jsx   # Searchable & filterable incident logs
│   │   │   ├── TestingLabTab.jsx     # Interactive 8-stage verification sandbox
│   │   │   └── SettingsTab.jsx       # Emergency contacts & zone config
│   │   ├── services/
│   │   │   └── api.js                # REST client & stream connectors
│   │   ├── utils/
│   │   │   └── audioSynth.js         # Web Audio API emergency siren & sound FX
│   │   ├── App.jsx                   # Main React dashboard orchestrator
│   │   ├── index.css                 # Dark navy glassmorphism styling
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md
│   └── TESTING_GUIDE.md
├── start_all.bat
├── start_backend.bat
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Python 3.10+** (verified on Python 3.13)
* **Node.js 18+** & **npm**

### Step 1: Start the Backend Server
```powershell
cd sentinel-ai/backend
python run_backend.py
```
*The FastAPI backend will start on `http://127.0.0.1:8000`.*
*Interactive API Swagger documentation is available at `http://127.0.0.1:8000/docs`.*

### Step 2: Start the Frontend Application
In a separate terminal:
```powershell
cd sentinel-ai/frontend
npm run dev
```
*The React UI will open on `http://localhost:5173`.*

> **Single-Command Production Mode:**
> Because the React production build (`frontend/dist`) is pre-compiled, you can simply run `python run_backend.py` and navigate directly to `http://127.0.0.1:8000` to access the full application without running Vite!

---

## 🔒 Privacy & Data Protection

SENTINEL AI adheres to strict zero-retention privacy principles:
1. **No Covert Surveillance:** Active monitoring is signified by an animated radar beacon and status badge.
2. **Ephemeral Memory Buffers:** Video frames and audio chunks are processed in volatile RAM and immediately discarded.
3. **Instant Privacy Kill Switch:** Clicking `STOP GUARD` terminates camera and microphone access instantly.
4. **Local Hardware Processing:** Audio FFT and vision analysis execute locally on the host machine.

---

## 📄 License
MIT License. Built for indoor safety, ambient intelligence, and resident peace of mind.
