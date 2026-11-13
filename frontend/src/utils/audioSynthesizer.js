/**
 * Web Audio API Acoustic Synthesizer & Alarm Generator
 * Plays emergency sirens and generates acoustic hazard test signals in real time.
 */

let audioCtx = null;
let sirenOsc1 = null;
let sirenOsc2 = null;
let sirenGain = null;
let isSirenActive = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playEmergencySiren() {
  if (isSirenActive) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.25, now);
    sirenGain.connect(ctx.destination);

    sirenOsc1 = ctx.createOscillator();
    sirenOsc2 = ctx.createOscillator();

    sirenOsc1.type = 'sawtooth';
    sirenOsc2.type = 'sine';

    // Warbling dual-tone alarm
    sirenOsc1.frequency.setValueAtTime(850, now);
    sirenOsc2.frequency.setValueAtTime(960, now);

    // LFO modulator for warble effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 3.5; // 3.5 Hz siren sweep
    lfoGain.gain.value = 350;

    lfo.connect(sirenOsc1.frequency);
    lfo.connect(sirenOsc2.frequency);

    sirenOsc1.connect(sirenGain);
    sirenOsc2.connect(sirenGain);

    lfo.start(now);
    sirenOsc1.start(now);
    sirenOsc2.start(now);

    isSirenActive = true;
  } catch (err) {
    console.warn("Could not start emergency siren:", err);
  }
}

export function stopEmergencySiren() {
  if (!isSirenActive) return;
  try {
    if (sirenGain && audioCtx) {
      sirenGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    if (sirenOsc1) {
      sirenOsc1.stop();
      sirenOsc1.disconnect();
    }
    if (sirenOsc2) {
      sirenOsc2.stop();
      sirenOsc2.disconnect();
    }
  } catch (e) {
    // Ignore
  } finally {
    isSirenActive = false;
  }
}

/**
 * Generates synthetic acoustic hazard sounds through speakers
 * so the local microphone can pick them up and test the AI!
 */
export function playSyntheticHazard(type) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  if (type === 'glass') {
    // Sharp high frequency brittle burst (4kHz - 8kHz) with noise
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const decay = Math.exp(-t * 20.0);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.65);

  } else if (type === 'alarm') {
    // Piezoelectric Smoke Alarm 3.1kHz pulsed beep (3 beeps)
    for (let b = 0; b < 3; b++) {
      const startTime = now + b * 0.28;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(3150, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
      gain.gain.setValueAtTime(0.5, startTime + 0.16);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.20);
    }

  } else if (type === 'impact') {
    // Heavy low frequency thud/impact 60Hz - 120Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);

  } else if (type === 'scream') {
    // Vocal tract high harmonic burst 1200 - 2200Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.linearRampToValueAtTime(1800, now + 0.35);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.7);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }
}
