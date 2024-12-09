class WhaleSound {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentScale: string[] = ['C3', 'E3', 'G3', 'C4'];
  private isInitialized = false;
  private isIOS = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for iOS
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
  }

  async initializeAudio() {
    if (this.isInitialized) return;

    try {
      // Use lower sample rate for iOS
      const contextOptions = this.isIOS ? { sampleRate: 44100 } : undefined;
      
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)(contextOptions);
      
      // For iOS, we need to resume the context immediately
      if (this.isIOS && this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.gainNode = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor();
      
      // Gentler settings for iOS
      if (this.isIOS) {
        compressor.threshold.value = -18;
        compressor.knee.value = 35;
        compressor.ratio.value = 8;
        this.gainNode.gain.value = 0.15; // Lower volume for iOS
      } else {
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        this.gainNode.gain.value = 0.2;
      }
      
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      this.gainNode.connect(compressor);
      compressor.connect(this.context.destination);
      
      this.isInitialized = true;

      // Add resume handler for iOS
      if (this.isIOS) {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.isInitialized = false;
    }
  }

  private handleVisibilityChange = async () => {
    if (!document.hidden && this.context?.state === 'suspended') {
      await this.context.resume();
    }
  };

  // Method to check if audio is ready
  isAudioReady(): boolean {
    return this.isInitialized && this.context?.state === 'running';
  }

  // Method to handle user interaction
  async handleUserInteraction() {
    if (!this.isInitialized) {
      await this.initializeAudio();
    } else if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  private async ensureContext() {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }
    return this.isAudioReady();
  }

  updateScale(level: number) {
    const scaleIndex = Math.min(Math.floor((level - 1) / 5), this.scales.length - 1);
    this.currentScale = this.scales[scaleIndex];
  }

  async playWhaleCall(level: number) {
    if (!await this.ensureContext() || !this.context || !this.gainNode) return;

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

  async playMilestone(level: number) {
    if (!await this.ensureContext()) return;
    
    this.updateScale(level);
    // Play ascending arpeggio
    this.currentScale.forEach((note, i) => {
      setTimeout(() => {
        this.playWhaleCall(level);
      }, i * 200);
    });
  }

  cleanup() {
    if (this.isIOS) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

export const whaleSound = new WhaleSound();

// Add this line at the end of the file
export const initializeAudio = () => whaleSound.handleUserInteraction(); 