# GRIHINI RAKSHAK (गृहिणी रक्षक)
### Autonomous Multimodal Indoor Safety & Domestic Disaster Defense System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB.svg?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?style=flat-square&logo=fastapi&logoColor=white)
![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5.0-5C3EE8.svg?style=flat-square&logo=opencv&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-DSP-FF6C37.svg?style=flat-square)
![Privacy First](https://img.shields.io/badge/Privacy-100%25_Ephemeral-success.svg?style=flat-square)

---

## Author & Developer

**Naina Kumari**  
*AI Systems Developer & Software Engineer*  

* **LinkedIn:** [linkedin.com/in/naina-kumari-06373132b](https://www.linkedin.com/in/naina-kumari-06373132b)  
* **GitHub:** [github.com/Naina137](https://github.com/Naina137)  
* **Project Repository:** [github.com/Naina137/grihini-rakshak](https://github.com/Naina137/grihini-rakshak)  

---

## Problem Statement: Why This Project Was Built

In millions of domestic households, homemakers (*grihinis*), elderly family members, and children spend substantial portions of their day alone at home. Domestic emergencies develop rapidly and silently:

1. **Kitchen & Gas Hazards:** Unattended cooking fires, LPG cylinder leaks, and sudden smoldering oil blazes.
2. **Electrical Incidents:** High-load switchboard short-circuits, loose wiring sparks, and aging electrical appliances.
3. **Mechanical Accidents:** Unbalanced, wobbling ceiling fans and collapsing wall-mounted units.
4. **Intrusion & Structural Hazards:** Break-ins through window shattering and unexpected entry.
5. **Medical & Physical Distress:** Sudden falls, medical shock, or vocal panic where an individual cannot physically reach their smartphone to place a call.

### The Problem With Existing Solutions
Existing smart safety systems require **dedicated IoT hardware**—Arduino boards, ESP32 microcontrollers, wired smoke detectors, and proprietary sensor hubs costing between ₹8,000 and ₹30,000, along with complex wiring and routine battery maintenance. Consequently, the vast majority of households remain completely unprotected.

---

## The Solution: Software-Only Domestic Sentinel

**GRIHINI RAKSHAK (गृहिणी रक्षक)** eliminates the hardware barrier completely. It leverages the commodity hardware already present in virtually every home—the camera and microphone of a laptop, desktop, tablet, or spare phone—and transforms it into a 24/7 intelligent domestic safety monitor.

* **Zero IoT Hardware Required:** Operates strictly via browser-standard optical and acoustic feeds.
* **100% In-Memory Privacy (Zero Video/Audio Storage):** Neither raw video frames nor raw audio waveforms are ever written to disk or transmitted to remote servers. All DSP and vision inference occur strictly in volatile memory.
* **Bilingual Accessibility:** Instant 1-click toggling between Hindi (हिन्दी) and English, ensuring usability for every family member.

---

## Core Technical Capabilities

```
+-----------------------------------------------------------------------------------+
|                           GRIHINI RAKSHAK ARCHITECTURE                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Optical Vision Feed]                   [Acoustic Audio Feed]                    |
|          |                                         |                              |
|          v                                         v                              |
|  +------------------------+             +------------------------+                |
|  | Kovac Skin Locus Filter|             | SciPy / NumPy FFT      |                |
|  | YCrCb + HSV Flame Rule |             | Spectral Centroid      |                |
|  | 6-15 Hz Flicker Check  |             | T-3 3100Hz Alarm Det.  |                |
|  | Motion & Occupant Cent.|             | >4.5kHz Glass Break    |                |
|  +------------------------+             +------------------------+                |
|          |                                         |                              |
|          +--------------------+  +-----------------+                              |
|                               |  |                                                |
|                               v  v                                                |
|                 +-------------------------------+                                 |
|                 | MULTI-MODAL RISK ENGINE (0-100|                                 |
|                 | Temporal Verification Window  |                                 |
|                 +-------------------------------+                                 |
|                               |                                                   |
|             +-----------------+-----------------+                                 |
|             v                                   v                                 |
|   [Normal / Elevated State]           [CRITICAL EMERGENCY]                        |
|   - 3D Holographic Mesh               - Fullscreen Modal Dispatch                 |
|   - 7-Day Safety Trend Graph          - Web Audio API 800-1200Hz Siren            |
|   - Voice Wellness Analysis           - 1-Click Silence & 30s Safe Cooldown       |
+-----------------------------------------------------------------------------------+
```

### 1. Computer Vision & False-Positive Rejection
* **Kovac Human Skin Locus Filter:** Traditional color thresholding mistypes warm indoor lighting and human skin as fire. GRIHINI RAKSHAK enforces strict chromatic bounds:
  $$\text{Skin: } Cr \in [133, 173], \quad Cb \in [80, 135], \quad Y \le 215$$
  Any pixel meeting this locus is explicitly eliminated from flame candidate masks before evaluating flame criteria ($Cr \ge 162, Cb \le 85, Y \ge 135$).
* **Flicker Dynamics:** Real combustion exhibits chaotic intensity oscillations between $6\text{ Hz}$ and $15\text{ Hz}$. Static warm objects are discarded through temporal variance checks.
* **1-Click AI Room Hazard Audit:** Analyzes the optical scene and tags danger zones (kitchen counters, loose wiring areas, overhead fans, entry points).

### 2. Acoustic Intelligence & Vocal Distress Analysis
* **High-Frequency Spectral DSP:** Uses real-time Fast Fourier Transforms (NumPy/SciPy `rfft`) to monitor specific acoustic signatures:
  * **Smoke Alarm:** Standardized ISO/NFPA T-3 cadence ($3100\text{ Hz} \pm 150\text{ Hz}$ tone bursts).
  * **Glass Breaking:** High-frequency dispersion concentrated above $4.5\text{ kHz}$ with transient energy thresholding ($RMS \ge 0.05, \text{Flatness} \le 0.45$) to reject mic hiss.
* **Dynamic Voice Stress & Autocorrelation:** Real-time fundamental frequency ($F_0$) autocorrelation to compute pitch stability and vocal jitter.
* **Speech Keyword Recognition:** Built-in Web Speech API recognition detecting emergency distress triggers in both English and Hindi:
  * *"Help"*, *"Emergency"*, *"Save me"*
  * *"बचाओ"*, *"मदद करो"*, *"आग लग गई"*

### 3. Interactive 3D Room Mesh & Historical Analytics
* **3D Holographic Room Model:** An interactive HTML5 Canvas 2D/3D perspective projection wireframe with $360^\circ$ mouse rotation, dynamic LIDAR sweep ring, and 5 interactive risk hotspots.
* **Comparative Hazard Ranking:** Comparative hazard evaluation scoring combustible storage ($89\%$), electrical overloads ($78\%$), window impact risks ($54\%$), and ceiling fan instability ($42\%$).
* **7-Day Safety Telemetry:** SVG trend analytics tracking domestic safety performance across the week.

### 4. Emergency Action & Siren Control
* **Web Audio API Autonomous Siren:** Modulated $800\text{ Hz} \leftrightarrow 1200\text{ Hz}$ dual-oscillator acoustic siren.
* **Instant Acknowledge & Snooze:** Pressing "Acknowledge & Secure" immediately silences the audio context and enforces a 30-second safe re-evaluation cooldown, preventing infinite false alert loops.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS, Lucide Icons |
| **Audio Processing** | Web Audio API (OscillatorNode, AnalyserNode), Web Speech API |
| **Graphics & Visualization** | HTML5 Canvas 2D/3D Perspective Engine, Custom SVG Charting |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn ASGI |
| **Computer Vision** | OpenCV (cv2), Kovac Skin Locus Rule, MOG2 Background Subtraction |
| **Signal Processing** | NumPy, SciPy Signal (`scipy.signal`, `scipy.fft`) |
| **Persistence** | SQLite3 / PostgreSQL compatible storage |

---

## Project Structure

```
grihini-rakshak/
├── backend/
│   ├── app/
│   │   ├── audio/              # Acoustic DSP, FFT feature extraction & classifiers
│   │   ├── engine/             # Multi-modal risk index & emergency dispatch logic
│   │   ├── vision/             # Optical detector, Kovac skin filter, flame/smoke rules
│   │   ├── config.py           # System settings & environmental thresholds
│   │   ├── database.py         # SQLite3 storage layer
│   │   └── main.py             # FastAPI REST endpoints & static asset mounts
│   ├── tests/
│   │   └── verify_all.py       # 8-stage automated diagnostic verification suite
│   ├── requirements.txt        # Backend dependencies
│   └── run_backend.py          # Unified FastAPI backend bootstrapper
├── frontend/
│   ├── src/
│   │   ├── components/         # React UI cards (3D Room, Camera, Voice, Audio, Sim)
│   │   ├── utils/              # Web Audio synthesizer & Hindi/English translations
│   │   ├── App.jsx             # Main dashboard assembly
│   │   └── main.jsx            # Application entrypoint
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite bundler configuration
├── sentinel.db                 # Local incident & alert audit database
├── run_sentinel.py             # Single-command full-stack launcher
└── README.md                   # System documentation
```

---

## Installation & Local Execution

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher (optional if using pre-compiled frontend in `backend/static/`)
* Standard webcam and microphone

### Step 1: Clone the Repository
```bash
git clone https://github.com/Naina137/grihini-rakshak.git
cd grihini-rakshak
```

### Step 2: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Launch the Full Application
```bash
# Return to root directory and run:
python run_sentinel.py
```
* The FastAPI backend will boot on port `8080`.
* Open your browser and navigate to: **`http://127.0.0.1:8080`**

### Step 4: Run Diagnostic Verification Suite
To verify all optical, acoustic, and risk engine algorithms:
```bash
python backend/tests/verify_all.py
```
Expected output:
```
============================================================
SENTINEL AI / GRIHINI RAKSHAK - FULL VERIFICATION REPORT
============================================================
Total Tests: 8
Passed: 8
Failed: 0
Status: ALL TESTS PASSED (100% Diagnostic Integrity)
============================================================
```

---

## Security, Ethics & Privacy Standards

1. **No Cloud Ingestion of Biometrics:** Camera frames and audio streams are processed locally inside device memory. No facial identities or speech recordings are collected or monetized.
2. **Transparent Simulation Disclosure:** Simulated atmospheric metrics (Temperature, Humidity, Gas PPM, Smoke Particulate) are explicitly watermarked as `SIMULATED` to maintain complete transparency when physical IoT sensors are absent.
3. **No External Hardware Monopoly:** Built to democratize home safety for every economic background without mandatory hardware subscriptions.

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with a commitment to domestic safety and family security by **Naina Kumari**.  
*Connect on LinkedIn:* [linkedin.com/in/naina-kumari-06373132b](https://www.linkedin.com/in/naina-kumari-06373132b)
