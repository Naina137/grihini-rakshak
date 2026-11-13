# SENTINEL AI — Verification & Testing Protocol Guide

This guide details how to execute and verify the 8 required diagnostic safety tests built into SENTINEL AI.

---

## 1. Automated Diagnostic Suite (1-Click Run)

To run the complete automated test suite:
1. Navigate to the **Hazard Testing Lab** tab in the web interface.
2. Click **RUN ALL 8 DIAGNOSTICS**.
3. All 8 tests will execute against the AI vision, acoustic, and risk engine pipelines and display pass/fail badges with detection metrics.

You can also execute the suite via API or command line:
```bash
curl http://127.0.0.1:8000/api/v1/test/suite
```

---

## 2. Individual Test Protocols

### Test 1: Fire Flame Detection Test
* **Objective:** Verify computer vision flame detection and anti-false positive filtering.
* **Mechanism:** Injects dynamic flame tongues with color grading ($\text{YCrCb} + \text{HSV}$) and temporal flicker jitter.
* **Pass Criteria:** Flame bounding box generated, confidence score $\ge 0.45$, flicker variance detected.

### Test 2: Smoke Detection Test
* **Objective:** Verify optical haze and contrast attenuation detection.
* **Mechanism:** Injects low-saturation, medium-luminance diffuse smoke cloud into the frame buffer.
* **Pass Criteria:** Smoke detection triggered, confidence score $\ge 0.40$, obscuration area percentage recorded.

### Test 3: Glass Breaking Acoustic Test
* **Objective:** Verify acoustic transient attack and high-frequency cluster recognition.
* **Mechanism:** Synthesizes multi-tone inharmonic burst at $5.2\text{ kHz}$, $7.4\text{ kHz}$, and $8.8\text{ kHz}$ with exponential decay and white noise.
* **Pass Criteria:** Primary class identified as `GLASS_BREAKING`, confidence score $\ge 0.85$.

### Test 4: Smoke / Fire Alarm Sound Test
* **Objective:** Verify recognition of UL 217 / NFPA 72 T-3 emergency alarm tones.
* **Mechanism:** Synthesizes $3100\text{ Hz}$ pure tone bursts with $0.5\text{s}$ interval modulation.
* **Pass Criteria:** Primary class identified as `SMOKE_ALARM` or `FIRE_ALARM`, dominant frequency matched at $3100\text{ Hz} \pm 50\text{ Hz}$.

### Test 5: Human Detection Pipeline Test
* **Objective:** Verify indoor occupant presence tracking without cloud latency.
* **Mechanism:** Validates anthropomorphic vertical aspect ratio ($1.25 \le \text{AR} \le 4.2$) and MOG2 foreground silhouette processing.
* **Pass Criteria:** Pipeline initializes, processes frames, and yields occupant bounding boxes without errors.

### Test 6: Camera Permission Failure Simulation
* **Objective:** Ensure the application degrades gracefully when the browser camera is blocked or hardware is unavailable.
* **Mechanism:** Triggers permission denial handler and verifies the UI offers the "Synthetic Chamber Stream" fallback without crashing.
* **Pass Criteria:** Friendly warning displayed, fallback stream operational.

### Test 7: Microphone Permission Failure Simulation
* **Objective:** Ensure audio monitoring failure falls back gracefully to vision-only surveillance.
* **Mechanism:** Mutes mic track or simulates permission denial.
* **Pass Criteria:** UI reports microphone muted, visual surveillance continues uninterrupted.

### Test 8: Network Failure & Offline Resilience Test
* **Objective:** Verify client-side resilience and local storage persistence during network interruptions.
* **Mechanism:** Tests endpoint reconnect loops, local state preservation, and client-side alert triggers.
* **Pass Criteria:** UI preserves current threat index and attempts reconnection every 2 seconds.
