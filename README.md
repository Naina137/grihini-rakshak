# GRIHINI RAKSHAK (गृहिणी रक्षक)

> **आपका घर. आपका परिवार. आपका AI रक्षक.**  
> *Your Home. Your Family. Your AI Guardian.*

---

## 🌟 Overview

**GRIHINI RAKSHAK (गृहिणी रक्षक)** is an intelligent, software-only indoor safety & disaster defense application designed specifically for homes and families. It transforms everyday devices (laptops, webcams, and microphones) into an active domestic guardian without requiring expensive external IoT hardware, Arduino, or ESP32 microcontrollers.

It continuously monitors indoor spaces to safeguard against:
* 🔥 **Kitchen & Gas Fires:** Detects burning flames, diffuse smoke plumes, and unlit combustible gas leaks.
* ⚡ **Electrical Hazards:** Identifies overloaded switchboards, loose wiring, and short-circuit sparks.
* 🌀 **Ceiling & Mechanical Accidents:** Evaluates wobbling ceiling fans and loose overhead fixtures.
* 🪟 **Perimeter & Intrusion Security:** Detects glass breaking frequencies ($>4.5\text{ kHz}$) and unauthorized motion.
* 🎙️ **Voice Wellness & Distress SOS:** Real-time vocal pitch, stability, and distress keyword recognition ("Help", "बचाओ").

---

## 🚀 Key Modules

### 1. 3D Holographic Room Mesh & Radar Scanner
* Interactive 3D wireframe room rendered via HTML5 canvas with sweeping LIDAR radar rings.
* 360° rotational perspective controls.
* Risk hotspots for electrical outlets, stoves, ceiling fans, windows, and occupant coordinates.

### 2. Optical Computer Vision & AI Room Hazard Inspection
* **Real-Time Flame & Smoke Detection:** Dual color segmentation ($\text{YCrCb} + \text{HSV}$) with dynamic 6–15 Hz flicker analysis.
* **Kovac Human Skin Locus Exclusion:** Excludes human faces and hands to guarantee zero false fire alarms.
* **1-Click Room Hazard Audit:** Click *"Scan Room for Hazards"* to automatically identify and tag potential danger points in your room.

### 3. Dynamic Voice Stress & Keyword Guardian
* Real-time fundamental pitch ($F_0$) autocorrelation tracking.
* Web Speech API keyword recognition (recognizes *"Help"*, *"बचाओ"*, *"आग"*, *"सब ठीक है"*).
* Dynamic psychological categorization: Normal/Calm, Anxious/Tremor, Loud Shouting, and Critical SOS.

### 4. 7-Day Safety Index & Comparative Threat Audit
* Comparative danger ranking (Combustibles $89\%$ vs Electrical Overload $78\%$ vs Glass $54\%$ vs Ceiling Fan $42\%$).
* 7-day interactive historical telemetry SVG trend chart.

### 5. 1-Click Bilingual Language Switcher (हिन्दी / English)
* Instant toggling between Hindi and English across all dashboards, alerts, voice reports, and guides.

---

## 💻 Tech Stack
* **Frontend:** React 18, Tailwind CSS, Web Audio API, Canvas 2D/3D Perspective, Lucide Icons.
* **Backend:** Python 3.13, FastAPI, Uvicorn, OpenCV 5.0, NumPy, SciPy FFT.
* **Database:** SQLite3 with full PostgreSQL support.
* **Architecture:** Ephemeral in-memory zero-retention data protection.

---

## 🏃 Quickstart

### Run with Python:
```bash
python run_sentinel.py
```
Open **`http://127.0.0.1:8080`** in your browser.

---

## 📄 License
MIT License. Built for home safety and family peace of mind.
