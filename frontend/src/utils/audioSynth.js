// Browser Web Audio API Sound Synthesizer for Alerts and Testing
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.sirenOsc1 = null;
    this.sirenGain = null;
    this.lfo = null;
    this.isSirenPlaying = false;
    
    // Unlock AudioContext on first user interaction anywhere on the document
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
    }
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Dual-tone pulsating emergency wail (880Hz - 1230Hz)
  startEmergencySiren() {
    if (this.isSirenPlaying) return;
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.35, ctx.currentTime);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc1 = ctx.createOscillator();
      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc1.frequency.setValueAtTime(920, ctx.currentTime);

      // Low frequency modulation for undulating wail (2.2 Hz)
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(2.2, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(320, ctx.currentTime);
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc1.frequency);

      this.sirenOsc1.connect(this.sirenGain);
      this.lfo.start();
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
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
        setTimeout(() => {
          if (this.sirenOsc1) {
            this.sirenOsc1.stop();
            this.sirenOsc1.disconnect();
            this.sirenOsc1 = null;
          }
          if (this.lfo) {
            this.lfo.stop();
            this.lfo.disconnect();
            this.lfo = null;
          }
          this.isSirenPlaying = false;
        }, 180);
      } else {
        this.isSirenPlaying = false;
      }
    } catch (e) {
      this.isSirenPlaying = false;
    }
  }

  // Play a quick pleasant confirmation chime
  playBeep(freq = 600, duration = 0.15) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Synthesize T3 Smoke Alarm (3100Hz 3-beep pattern)
  playSmokeAlarmTone(duration = 2.0) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3100, ctx.currentTime);
      
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
    } catch (e) {}
  }

  // Synthesize Glass Shattering Noise
  playGlassBreakSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      const freqs = [5200, 7400, 8900];
      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });

      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  // Synthesize Heavy Low-Frequency Impact
  playImpactSound() {
    try {
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
    } catch (e) {}
  }
}

export const audioSynth = new AudioSynthesizer();
