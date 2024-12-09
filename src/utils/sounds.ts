class WhaleSound {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentScale: string[] = ['C3', 'E3', 'G3', 'C4']; // Starting scale

  private noteToFreq: { [key: string]: number } = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88
  };

  private scales = [
    ['C3', 'E3', 'G3'],           // Level 1-5: Simple triad
    ['C3', 'E3', 'G3', 'B3'],     // Level 6-10: Add seventh
    ['C3', 'D3', 'E3', 'G3', 'A3'], // Level 11-15: Pentatonic
    ['C3', 'E3', 'G3', 'C4'],     // Level 16-20: Octave spread
    ['C3', 'E3', 'G3', 'B3', 'D4']  // Level 21+: Extended harmony
  ];

  private initContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.gainNode = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor();
      
      // Gentler compression settings
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      this.gainNode.connect(compressor);
      compressor.connect(this.context.destination);
      this.gainNode.gain.value = 0.2; // Reduced overall volume
    }
  }

  updateScale(level: number) {
    const scaleIndex = Math.min(Math.floor((level - 1) / 5), this.scales.length - 1);
    this.currentScale = this.scales[scaleIndex];
  }

  playWhaleCall(level: number) {
    this.initContext();
    if (!this.context || !this.gainNode) return;

    this.updateScale(level);
    const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
    const frequency = this.noteToFreq[note];

    // Create oscillators
    const mainOsc = this.context.createOscillator();
    const modulatorOsc = this.context.createOscillator();
    const subOsc = this.context.createOscillator(); // Subtle sub-oscillator
    
    // Create gain nodes
    const mainGain = this.context.createGain();
    const modulatorGain = this.context.createGain();
    const subGain = this.context.createGain();
    
    // Create filter
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    // Connect everything
    mainOsc.connect(mainGain);
    modulatorOsc.connect(modulatorGain);
    subOsc.connect(subGain);
    modulatorGain.connect(mainOsc.frequency);
    mainGain.connect(filter);
    subGain.connect(filter);
    filter.connect(this.gainNode);

    const now = this.context.currentTime;
    
    // Main oscillator settings
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(frequency, now);
    
    // Modulator settings (gentler FM)
    modulatorOsc.type = 'sine';
    modulatorOsc.frequency.setValueAtTime(1 + level * 0.2, now);
    modulatorGain.gain.setValueAtTime(30 + level, now);
    
    // Sub oscillator (one octave down, very quiet)
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(frequency * 0.5, now);
    subGain.gain.setValueAtTime(0.1, now);

    // Envelope
    const attackTime = 0.1;
    const decayTime = 0.2;
    const sustainLevel = 0.3;
    const releaseTime = 0.3;

    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.3, now + attackTime);
    mainGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    mainGain.gain.linearRampToValueAtTime(0, now + attackTime + decayTime + releaseTime);

    // Frequency modulation
    mainOsc.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.2);
    mainOsc.frequency.exponentialRampToValueAtTime(frequency * 0.9, now + 0.4);

    // Start and stop
    mainOsc.start(now);
    modulatorOsc.start(now);
    subOsc.start(now);

    const stopTime = now + attackTime + decayTime + releaseTime;
    mainOsc.stop(stopTime);
    modulatorOsc.stop(stopTime);
    subOsc.stop(stopTime);
  }

  playMilestone(level: number) {
    this.updateScale(level);
    // Play ascending arpeggio
    this.currentScale.forEach((note, i) => {
      setTimeout(() => {
        this.playWhaleCall(level);
      }, i * 200); // Faster sequence
    });
  }
}

export const whaleSound = new WhaleSound(); 