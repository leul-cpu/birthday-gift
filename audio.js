/**
 * CINEMATIC SOUND ENGINE (Web Audio API)
 * Generative, zero-dependency atmospheric sound design.
 * All sound is synthesized mathematically in-browser, guaranteeing
 * instantaneous playback, zero latency, and zero broken URL dependencies.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Limiter / Compressor to avoid any harsh clipping
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio initialization skipped:", e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.75;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.3);
    }
    return this.isMuted;
  }

  /**
   * Continuous subtle low-frequency atmospheric drone.
   * Evokes late-night silence, warm analog tape, and cinematic anticipation.
   */
  startAmbientDrone() {
    this.ensureContext();
    if (!this.ctx || this.droneGain) return;

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.exponentialRampToValueAtTime(0.18, now + 4.0); // Gentle 4-second fade in
    this.droneGain.connect(this.masterGain);

    // Warm Low-pass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(160, now);
    filter.Q.setValueAtTime(2.5, now);
    filter.connect(this.droneGain);

    // Subtle LFO modulating the filter for breathing atmosphere
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, now); // Very slow cycle (8.3 seconds)
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);

    // Drone Voice 1 (Fundamental C#2 = 69.3Hz)
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = "triangle";
    this.ambientOsc1.frequency.setValueAtTime(69.3, now);
    this.ambientOsc1.connect(filter);
    this.ambientOsc1.start(now);

    // Drone Voice 2 (Fifth G#2 slightly detuned = 104.1Hz)
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = "sine";
    this.ambientOsc2.frequency.setValueAtTime(104.1, now);
    this.ambientOsc2.detune.setValueAtTime(4, now);
    this.ambientOsc2.connect(filter);
    this.ambientOsc2.start(now);
  }

  /**
   * Tactile touch feedback when the central light/orb is touched.
   */
  playOrbTouch(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(320 + intensity * 240, now);
    filter.Q.setValueAtTime(4.0, now);

    osc.type = "sine";
    osc.frequency.setValueAtTime(220 + intensity * 110, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);

    const volume = Math.min(0.28, 0.12 * intensity);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * Orb release or scene transformation pulse
   */
  playOrbPulse() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.35);
  }

  /**
   * Realistic tactile paper sliding sound for photograph manipulation.
   */
  playPaperSlide() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15; // 150ms buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish noise generation
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.12;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Simulated analog camera shutter click for the flashback montage.
   */
  playShutterFlash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Fast mechanical click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);

    // Second click (mirror return) after 80ms
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(900, t);
      osc2.frequency.exponentialRampToValueAtTime(80, t + 0.05);

      gain2.gain.setValueAtTime(0.15, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.07);
    }, 75);
  }

  /**
   * Harmonious tonal chime when selecting a future aspiration.
   */
  playChoiceResonance(choiceIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Chords: D maj9 elements (D4: 293.66, F#4: 369.99, A4: 440, C#5: 554.37, E5: 659.25)
    const pitches = [293.66, 369.99, 440.00, 554.37];
    const baseFreq = pitches[choiceIndex % pitches.length];

    [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      const vol = idx === 0 ? 0.22 : 0.12;
      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(vol, now + idx * 0.04 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + 2.0);
    });
  }

  /**
   * Rich, emotional musical swell for the grand birthday reveal.
   * Majestic, warm brass/pad chord with soft shimmer harmonics.
   */
  playClimaxSwell() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Warm, emotional D Major add9 Chord: D3, A3, F#4, E5, A5
    const frequencies = [146.83, 220.00, 369.99, 659.25, 880.00];

    frequencies.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i < 2 ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Low pass filter with swell
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + 2.4);

      const delayOffset = i * 0.07;
      const targetGain = 0.14 / (i + 1);

      gain.gain.setValueAtTime(0.0001, now + delayOffset);
      gain.gain.linearRampToValueAtTime(targetGain, now + delayOffset + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delayOffset);
      osc.stop(now + 7.8);
    });
  }

  /**
   * CINEMATIC BIRTHDAY SONG THEME
   * Synthesized warm music-box / celesta & electric piano arrangement
   * of the iconic "Happy Birthday to You" with harmonic acoustic chords.
   * Zero external dependencies, zero broken links, works completely offline.
   */
  playBirthdayMelody(options = {}) {
    this.ensureContext();
    if (!this.ctx) return;

    // Stop any previously playing instance
    this.stopBirthdayMelody();

    // Check if custom audio URL is configured and active
    const customUrl = options.customAudioUrl || (window.EXPERIENCE_CONFIG && window.EXPERIENCE_CONFIG.audio && window.EXPERIENCE_CONFIG.audio.customAudioUrl);
    if (customUrl) {
      try {
        this.customAudioEl = new Audio(customUrl);
        this.customAudioEl.volume = this.isMuted ? 0 : 0.8;
        this.customAudioEl.play().catch(() => {
          // Fallback to synthesized melody if playback is blocked or file not found
          this.synthesizeBirthdayMelody(options.loop !== false);
        });
        return;
      } catch (e) {
        console.warn("Custom audio playback failed, falling back to synthesized theme", e);
      }
    }

    this.synthesizeBirthdayMelody(options.loop !== false);
  }

  synthesizeBirthdayMelody(shouldLoop = true) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime + 0.15;
    this.birthdayNodes = [];
    this.birthdayTimers = [];

    // Dedicated bus for the Birthday theme with subtle stereo shimmer delay
    this.birthdayGain = this.ctx.createGain();
    this.birthdayGain.gain.setValueAtTime(0.42, now);

    // Warm delay line (celestial shimmer)
    const delay = this.ctx.createDelay();
    delay.delayTime.setValueAtTime(0.24, now);
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.22, now);
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.setValueAtTime(2200, now);

    this.birthdayGain.connect(this.masterGain);
    this.birthdayGain.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayFilter.connect(this.masterGain);

    // F Major note frequencies (Hz)
    const N = {
      F2: 87.31,
      Bb2: 116.54,
      C3: 130.81,
      D3: 146.83,
      E3: 164.81,
      F3: 174.61,
      G3: 196.00,
      A3: 220.00,
      Bb3: 233.08,
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.00,
      A4: 440.00,
      Bb4: 466.16,
      C5: 523.25,
      D5: 587.33,
      F5: 698.46
    };

    /**
     * Synthesize a warm music-box / celesta chime note
     */
    const playNote = (freq, timeOffset, duration, velocity = 1.0) => {
      if (!this.ctx) return;
      const startTime = now + timeOffset;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Osc 1: Pure singing bell tone
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, startTime);

      // Osc 2: Delicate harmonic chime overtone (detuned octave)
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      osc2.detune.setValueAtTime(5, startTime);

      // Lowpass warmth
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(3200, freq * 4), startTime);
      filter.Q.setValueAtTime(1.8, startTime);

      // Envelope: gentle clickless attack, natural acoustic decay
      const peakVol = 0.28 * velocity;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(peakVol * 0.45, startTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 1.8);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.birthdayGain);

      osc1.start(startTime);
      osc2.start(startTime);
      const stopTime = startTime + duration * 1.9;
      osc1.stop(stopTime);
      osc2.stop(stopTime);

      this.birthdayNodes.push(osc1, osc2, gain);
    };

    /**
     * Synthesize warm acoustic bass / harmonic backing chords
     */
    const playChord = (frequencies, timeOffset, duration, volume = 0.08) => {
      if (!this.ctx) return;
      const startTime = now + timeOffset;
      frequencies.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(f, startTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600 + f * 1.5, startTime);

        const v = volume / (idx === 0 ? 1 : 1.3);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(v, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.birthdayGain);

        osc.start(startTime);
        osc.stop(startTime + duration * 2.3);
        this.birthdayNodes.push(osc, gain);
      });
    };

    // Pacing: 0.52s per quarter note (waltz feel, ~115 BPM)
    const b = 0.52;

    // --- Phrase 1: "Happy Birthday to you" ---
    playNote(N.C4, 0.00 * b, 0.75 * b, 0.85);
    playNote(N.C4, 0.75 * b, 0.25 * b, 0.70);
    playNote(N.D4, 1.00 * b, 1.00 * b, 1.00);
    playNote(N.C4, 2.00 * b, 1.00 * b, 0.95);
    playNote(N.F4, 3.00 * b, 1.00 * b, 1.05);
    playNote(N.E4, 4.00 * b, 2.00 * b, 1.10);
    playChord([N.C3, N.G3, N.C4], 4.00 * b, 2.00 * b, 0.09); // C Major chord

    // --- Phrase 2: "Happy Birthday to you" ---
    playNote(N.C4, 6.00 * b, 0.75 * b, 0.85);
    playNote(N.C4, 6.75 * b, 0.25 * b, 0.70);
    playNote(N.D4, 7.00 * b, 1.00 * b, 1.00);
    playNote(N.C4, 8.00 * b, 1.00 * b, 0.95);
    playNote(N.G4, 9.00 * b, 1.00 * b, 1.10);
    playNote(N.F4, 10.00 * b, 2.00 * b, 1.15);
    playChord([N.F2, N.C3, N.A3], 10.00 * b, 2.00 * b, 0.10); // F Major chord

    // --- Phrase 3: "Happy Birthday dear [Name]" ---
    playNote(N.C4, 12.00 * b, 0.75 * b, 0.85);
    playNote(N.C4, 12.75 * b, 0.25 * b, 0.70);
    playNote(N.C5, 13.00 * b, 1.00 * b, 1.20);
    playNote(N.A4, 14.00 * b, 1.00 * b, 1.10);
    playNote(N.F4, 15.00 * b, 1.00 * b, 1.05);
    playNote(N.E4, 16.00 * b, 1.00 * b, 0.95);
    playNote(N.D4, 17.00 * b, 2.00 * b, 1.05);
    playChord([N.Bb2, N.F3, N.D4], 17.00 * b, 2.00 * b, 0.11); // Bb Major chord

    // --- Phrase 4: "Happy Birthday to you" (Grand Emotional Climax) ---
    playNote(N.Bb4, 19.00 * b, 0.75 * b, 1.00);
    playNote(N.Bb4, 19.75 * b, 0.25 * b, 0.80);
    playNote(N.A4, 20.00 * b, 1.00 * b, 1.10);
    playNote(N.F4, 21.00 * b, 1.00 * b, 1.05);
    playNote(N.G4, 22.00 * b, 1.00 * b, 1.15);
    playNote(N.F4, 23.00 * b, 2.80 * b, 1.30);
    playChord([N.F2, N.C3, N.F3, N.A3, N.C4], 23.00 * b, 3.20 * b, 0.13); // Grand F Major resolution

    // If loop is enabled, softly repeat after a 4-second breath
    if (shouldLoop) {
      const songDurationMs = (26.5 * b + 3.8) * 1000;
      const loopTimer = setTimeout(() => {
        if (this.ctx && !this.isMuted && this.birthdayGain) {
          this.synthesizeBirthdayMelody(true);
        }
      }, songDurationMs);
      this.birthdayTimers.push(loopTimer);
    }
  }

  /**
   * Immediately stops the birthday melody
   */
  stopBirthdayMelody() {
    if (this.customAudioEl) {
      try {
        this.customAudioEl.pause();
        this.customAudioEl.currentTime = 0;
      } catch (e) {}
      this.customAudioEl = null;
    }

    if (this.birthdayTimers && this.birthdayTimers.length) {
      this.birthdayTimers.forEach(t => clearTimeout(t));
      this.birthdayTimers = [];
    }

    if (this.birthdayGain && this.ctx) {
      try {
        this.birthdayGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.birthdayGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
      } catch (e) {}
    }

    if (this.birthdayNodes && this.birthdayNodes.length) {
      setTimeout(() => {
        this.birthdayNodes.forEach(node => {
          try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
          } catch (e) {}
        });
        this.birthdayNodes = [];
      }, 250);
    }
  }

  /**
   * Stop / Reset all sound synthesis
   */
  stopAll() {
    if (!this.ctx) return;
    try {
      if (this.ambientOsc1) { this.ambientOsc1.stop(); this.ambientOsc1 = null; }
      if (this.ambientOsc2) { this.ambientOsc2.stop(); this.ambientOsc2 = null; }
      this.droneGain = null;
      this.stopBirthdayMelody();
    } catch (e) {}
  }
}

// Global instance
window.sound = new SoundEngine();
