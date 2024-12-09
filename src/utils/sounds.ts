class WhaleSound {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentScale: string[] = ['C3', 'E3', 'G3', 'C4'];
  private isInitialized = false;
  private isIOS = false;

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

  constructor() {
    // Check if running on iOS
    if (typeof window !== 'undefined') {
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
  }

  async initializeAudio() {
    if (this.isInitialized) return true;

    try {
      // Create audio context with iOS-friendly settings
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.isIOS ? 44100 : 48000,
        latencyHint: 'interactive'
      });

      // Basic gain setup
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.isIOS ? 0.5 : 0.2; // Higher volume for iOS
      this.gainNode.connect(this.context.destination);

      // Resume context
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  updateScale(level: number) {
    const scaleIndex = Math.min(Math.floor((level - 1) / 5), this.scales.length - 1);
    this.currentScale = this.scales[scaleIndex];
  }

  async playWhaleCall(level: number) {
    if (!this.context || !this.gainNode || !this.isInitialized) return;

    try {
      // Resume context if needed (important for iOS)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.updateScale(level);
      const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
      const frequency = this.noteToFreq[note];

      // Create oscillators
      const mainOsc = this.context.createOscillator();
      const modulatorOsc = this.context.createOscillator();
      const mainGain = this.context.createGain();

      // Connect nodes
      mainOsc.connect(mainGain);
      mainGain.connect(this.gainNode);

      // Configure oscillators
      mainOsc.type = 'sine';
      modulatorOsc.type = 'sine';

      const now = this.context.currentTime;
      
      // Simpler envelope for iOS
      if (this.isIOS) {
        mainOsc.frequency.setValueAtTime(frequency, now);
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        mainGain.gain.linearRampToValueAtTime(0, now + 0.3);
      } else {
        // More complex sound for non-iOS
        mainOsc.frequency.setValueAtTime(frequency, now);
        mainOsc.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.2);
        mainOsc.frequency.exponentialRampToValueAtTime(frequency * 0.9, now + 0.4);
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        mainGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
        mainGain.gain.linearRampToValueAtTime(0, now + 0.4);
      }

      // Start and stop
      mainOsc.start(now);
      mainOsc.stop(now + (this.isIOS ? 0.3 : 0.4));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  async playMilestone(level: number) {
    if (!this.isInitialized) return;
    
    this.updateScale(level);
    const delay = this.isIOS ? 150 : 200; // Faster sequence on iOS
    
    for (let i = 0; i < this.currentScale.length; i++) {
      setTimeout(() => {
        this.playWhaleCall(level);
      }, i * delay);
    }
  }
}

export const whaleSound = new WhaleSound();

export const initializeAudio = async () => {
  return await whaleSound.initializeAudio();
}; 