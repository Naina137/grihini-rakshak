# SENTINEL AI — System Architecture & Technical Specifications

## 1. High-Level Architecture Overview

```
                                      +------------------------------------+
                                      |         SENTINEL AI CLIENT         |
                                      |          (React.js / Vite)         |
                                      +-----------------+------------------+
                                                        |
                            +---------------------------+---------------------------+
                            |                                                       |
                            v                                                       v
                 [Optical Camera Feed]                                   [Acoustic Audio Feed]
                            |                                                       |
                            v                                                       v
                     (Canvas 2D HUD)                                         (Web Audio API)
               - Bounding Boxes (Fire/Smoke)                           - FFT Spectrum Analyzer
               - Occupant Silhouette Overlay                           - Oscilloscope Waveform
               - Camera ON/OFF & Privacy Mute                          - Decibel Meter (dB SPL)
                            |                                                       |
                            +---------------------------+---------------------------+
                                                        |
                                                        v
                                         REST / WebSocket Pipeline (/api/v1)
                                                        |
                                                        v
+---------------------------------------------------------------------------------------------------+
|                                    SENTINEL FASTAPI BACKEND                                       |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +---------------------------+   +---------------------------+   +------------------------------+ |
|  |   Computer Vision Engine  |   | Acoustic Signal Engine    |   | Environmental Simulator      | |
|  |---------------------------|   |---------------------------|   |------------------------------| |
|  | - YCrCb/HSV Color Filter  |   | - Windowed Hanning FFT    |   | - Synthetic Temperature      | |
|  | - 5-15 Hz Flame Flicker   |   | - Spectral Centroid       |   | - Relative Humidity (%)      | |
|  | - Shape Solidity Defects  |   | - Spectral Rolloff (85%)  |   | - Particulate Smoke (PPM)    | |
|  | - Contrast Attenuation    |   | - Zero Crossing Rate      |   | - Combustible Gas / CO (PPM) | |
|  | - Silhouette Aspect Ratio |   | - Wiener Spectral Flatness|   | - Transparent Tagging        | |
|  | - MOG2 Foreground Motion  |   | - UL 217 T-3 Alarm Band   |   |   (is_simulated = True)      | |
|  +-------------+-------------+   +-------------+-------------+   +--------------+---------------+ |
|                |                               |                                |                 |
|                +-------------------------------+--------------------------------+                 |
|                                                |                                                  |
|                                                v                                                  |
|                                 +------------------------------+                                  |
|                                 |   INTELLIGENT RISK ENGINE    |                                  |
|                                 |------------------------------|                                  |
|                                 | - Multi-Modal Evidence Rule  |                                  |
|                                 | - Temporal Rolling Window    |                                  |
|                                 | - Normalized Threat Index    |                                  |
|                                 |   (0 - 100)                  |                                  |
|                                 | - Hierarchical Classification|                                  |
|                                 |   (NORMAL/WARN/HIGH/CRITICAL)|                                  |
|                                 +--------------+---------------+                                  |
|                                                |                                                  |
|                                                v                                                  |
|                                 +------------------------------+                                  |
|                                 |        ALERT MANAGER         |                                  |
|                                 |------------------------------|                                  |
|                                 | - Cooldown & Deduplication   |                                  |
|                                 | - SQLite / PostgreSQL Store  |                                  |
|                                 | - Emergency Siren Trigger    |                                  |
|                                 | - Dispatch Contact Stubs     |                                  |
|                                 +------------------------------+                                  |
+---------------------------------------------------------------------------------------------------+
```

## 2. Multi-Modal Threat Convergence Formula

The normalized Threat Index $T \in [0, 100]$ is computed dynamically by evaluating visual flame confidence $C_{\text{fire}}$, acoustic alarm confidence $C_{\text{alarm}}$, smoke obscuration $C_{\text{smoke}}$, glass shatter indicator $G$, acoustic impact $I$, and simulated atmospheric risk $A$:

$$T = \max \Big( T_{\text{convergent}}, T_{\text{verified\_fire}}, T_{\text{alarm\_solo}}, T_{\text{glass\_motion}}, T_{\text{smoke\_alarm}} \Big)$$

Where:
* **Convergent Active Fire ($T \ge 98$):**
  $$C_{\text{fire}} \ge 0.55 \land C_{\text{alarm}} \ge 0.60 \implies \text{CRITICAL}$$
* **Sustained Flame ($T \ge 92$):**
  $$C_{\text{fire}} \ge 0.80 \land \sum_{t=1}^{N} \mathbb{I}(\text{flame}_t) \ge 2 \implies \text{CRITICAL}$$
* **Burglary / Break-In ($T \ge 85$):**
  $$C_{\text{glass}} \ge 0.65 \land M_{\text{unusual}} = \text{True} \implies \text{HIGH RISK}$$
* **Distress Screaming ($T \ge 80$):**
  $$C_{\text{scream}} \ge 0.65 \implies \text{HIGH RISK}$$

## 3. Acoustic Signature Specifications

| Acoustic Hazard | Target Frequency Band | Key Spectral Features | Attack / Decay Profile |
| :--- | :--- | :--- | :--- |
| **Smoke / Fire Alarm** | $2900 - 3400\text{ Hz}$ (center: $3100\text{ Hz}$) | High pure-tone concentration, spectral flatness $< 0.08$ | T-3 pattern: 3 pulses ($0.5\text{s}$ on, $0.5\text{s}$ off) |
| **Glass Shattering** | $> 4500\text{ Hz}$ (peaks: $5.2, 7.4, 8.8\text{ kHz}$) | Centroid $> 4200\text{ Hz}$, Rolloff $> 6500\text{ Hz}$, high ZCR | Sharp onset ($< 20\text{ ms}$), fast decay ($< 250\text{ ms}$) |
| **Distress Scream** | $1200 - 3200\text{ Hz}$ | Formant resonance, high RMS energy, pitch jitter | Sustained ($> 400\text{ ms}$) vocal intensity |
| **Heavy Impact** | $< 450\text{ Hz}$ | Peak amplitude spike, low-frequency dominant ratio | Exponential transient decay ($< 350\text{ ms}$) |

## 4. Privacy & Zero-Retention Security Architecture

* **Ephemeral Frame Buffers:** BGR frames and PCM audio buffers are held in memory during the inference pass and garbage collected immediately.
* **Database Minimization:** The SQLite/PostgreSQL database stores strictly structured metadata (Incident ID, Timestamp, Risk Level, Hazard Description, Acknowledgment Status).
* **Access Control:** Operator endpoints require bearer token authentication.
