const API_BASE = '/api/v1';

export async function checkBackendHealth() {
  try {
    const res = await fetch('/health');
    return await res.json();
  } catch (err) {
    return { status: 'OFFLINE', error: err.message };
  }
}

export async function analyzeFrame(imageBase64, roomName = 'Living Room - Unit 4B') {
  const res = await fetch(`${API_BASE}/stream/analyze-frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      room_name: roomName,
    })
  });
  if (!res.ok) throw new Error(`Frame analysis failed: ${res.statusText}`);
  return await res.json();
}

export async function analyzeAudioChunk(audioBase64, sampleRate = 22050, syntheticEvent = null) {
  const res = await fetch(`${API_BASE}/stream/analyze-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: audioBase64,
      sample_rate: sampleRate,
      synthetic_event: syntheticEvent
    })
  });
  if (!res.ok) throw new Error(`Audio analysis failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchAlerts(limit = 50) {
  const res = await fetch(`${API_BASE}/alerts/?limit=${limit}`);
  if (!res.ok) throw new Error(`Fetch alerts failed: ${res.statusText}`);
  return await res.json();
}

export async function acknowledgeAlert(alertId, notes = 'Acknowledged by operator') {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  if (!res.ok) throw new Error(`Acknowledge failed: ${res.statusText}`);
  return await res.json();
}

export async function dismissCriticalModal() {
  const res = await fetch(`${API_BASE}/alerts/dismiss-modal`, { method: 'POST' });
  return await res.json();
}

export async function fetchContacts() {
  const res = await fetch(`${API_BASE}/alerts/contacts`);
  if (!res.ok) throw new Error(`Fetch contacts failed: ${res.statusText}`);
  return await res.json();
}

export async function saveContact(contact) {
  const res = await fetch(`${API_BASE}/alerts/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact)
  });
  if (!res.ok) throw new Error(`Save contact failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchSimulationStatus() {
  const res = await fetch(`${API_BASE}/simulation/`);
  if (!res.ok) throw new Error(`Fetch simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function applySimulationPreset(presetName) {
  const res = await fetch(`${API_BASE}/simulation/preset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset_name: presetName })
  });
  if (!res.ok) throw new Error(`Preset update failed: ${res.statusText}`);
  return await res.json();
}

export async function updateCustomSimulation(temp, humidity, smokePpm, gasPpm) {
  const res = await fetch(`${API_BASE}/simulation/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      temperature: temp,
      humidity: humidity,
      smoke_ppm: smokePpm,
      gas_ppm: gasPpm
    })
  });
  if (!res.ok) throw new Error(`Custom simulation update failed: ${res.statusText}`);
  return await res.json();
}

export async function runIndividualTest(testName) {
  const res = await fetch(`${API_BASE}/test/run-test/${testName}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Test run failed: ${res.statusText}`);
  return await res.json();
}

export async function runFullDiagnosticSuite() {
  const res = await fetch(`${API_BASE}/test/suite`);
  if (!res.ok) throw new Error(`Diagnostic suite failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchTimeline(limit = 30) {
  const res = await fetch(`${API_BASE}/alerts/timeline?limit=${limit}`);
  if (!res.ok) return { events: [] };
  return await res.json();
}
