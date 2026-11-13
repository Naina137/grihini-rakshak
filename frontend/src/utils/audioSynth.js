// Browser Web Audio API Sound Synthesizer for Alerts and Testing
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Dual-tone pulsating emergency wail (960Hz - 1400Hz)
  startEmergencySiren() {
    if (this.isSirenPlaying) return;
    try {
      const ctx = this.getAudioContext();
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.25, ctx.currentTime);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc1 = ctx.createOscillator();
      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc1.frequency.setValueAtTime(880, ctx.currentTime);

      // Low frequency modulation for wailing effect (2 Hz)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(2.0, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(350, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc1.frequency);

      this.sirenOsc1.connect(this.sirenGain);
      lfo.start();
      this.sirenOsc1.start();
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Audio siren start failed:', e);
    }
  }

  stopEmergencySiren() {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          if (this.sirenOsc1) {
            this.sirenOsc1.stop();
            this.sirenOsc1.disconnect();
          }
          this.isSirenPlaying = false;
        }, 220);
      } else {
        this.isSirenPlaying = false;
      }
    } catch (e) {
      this.isSirenPlaying = false;
    }
  }

  // Synthesize T3 Smoke Alarm (3100Hz 3-beep pattern)
  playSmokeAlarmTone(duration = 2.0) {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3100, ctx.currentTime);
    
    // T3 temporal pattern: 0.5s on, 0.5s off
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.6;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.setValueAtTime(0, t + 0.4);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  // Synthesize Glass Shattering Noise
  playGlassBreakSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // High frequency inharmonic cluster (5200Hz, 7400Hz, 8800Hz)
    const freqs = [5200, 7400, 8900];
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });

    // White noise burst
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }

  // Synthesize Heavy Low-Frequency Impact
  playImpactSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

export const audioSynth = new AudioSynthesizer();
