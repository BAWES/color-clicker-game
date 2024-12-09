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
    ['C3', 'E3', 'G3'],
    ['C3', 'E3', 'G3', 'B3'],
    ['C3', 'D3', 'E3', 'G3', 'A3'],
    ['C3', 'E3', 'G3', 'C4'],
    ['C3', 'E3', 'G3', 'B3', 'D4']
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
  }

  async initializeAudio() {
    if (this.isInitialized) return;

    try {
      // Create a short beep to unlock audio
      const unlockContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = unlockContext.createOscillator();
      const gain = unlockContext.createGain();
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(unlockContext.destination);
      oscillator.start(0);
      oscillator.stop(0.1);

      // Create main audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.isIOS ? 44100 : 48000,
        latencyHint: 'interactive'
      });

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.gainNode = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor();
      
      if (this.isIOS) {
        compressor.threshold.value = -18;
        compressor.knee.value = 35;
        compressor.ratio.value = 8;
        this.gainNode.gain.value = 0.15;
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
        document.addEventListener('touchstart', this.handleTouch, { once: true });
      }

      console.log('Audio initialized successfully');
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

  private handleTouch = async () => {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  };

  updateScale(level: number) {
    const scaleIndex = Math.min(Math.floor((level - 1) / 5), this.scales.length - 1);
    this.currentScale = this.scales[scaleIndex];
  }

  async playWhaleCall(level: number) {
    if (!this.context || !this.gainNode || this.context.state !== 'running') {
      console.log('Audio not ready:', {
        contextExists: !!this.context,
        gainNodeExists: !!this.gainNode,
        contextState: this.context?.state
      });
      return;
    }

    try {
      this.updateScale(level);
      const note = this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
      const frequency = this.noteToFreq[note];

      const mainOsc = this.context.createOscillator();
      const modulatorOsc = this.context.createOscillator();
      const mainGain = this.context.createGain();
      const modulatorGain = this.context.createGain();

      mainOsc.type = 'sine';
      modulatorOsc.type = 'sine';
      
      mainOsc.frequency.setValueAtTime(frequency, this.context.currentTime);
      modulatorOsc.frequency.setValueAtTime(5 + level * 0.5, this.context.currentTime);
      
      mainGain.gain.setValueAtTime(0, this.context.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
      mainGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);
      
      modulatorGain.gain.setValueAtTime(frequency * 0.1, this.context.currentTime);

      modulatorOsc.connect(modulatorGain);
      modulatorGain.connect(mainOsc.frequency);
      mainOsc.connect(mainGain);
      mainGain.connect(this.gainNode);

      mainOsc.start(this.context.currentTime);
      modulatorOsc.start(this.context.currentTime);

      mainOsc.stop(this.context.currentTime + 0.3);
      modulatorOsc.stop(this.context.currentTime + 0.3);

      console.log('Sound played successfully');
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  async playMilestone(level: number) {
    if (!this.context || !this.gainNode) return;
    
    this.updateScale(level);
    for (let i = 0; i < this.currentScale.length; i++) {
      setTimeout(() => {
        this.playWhaleCall(level);
      }, i * 200);
    }
  }

  cleanup() {
    if (this.isIOS) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      document.removeEventListener('touchstart', this.handleTouch);
    }
  }
}

export const whaleSound = new WhaleSound();

// Export a function to initialize audio
export const initializeAudio = async () => {
  try {
    await whaleSound.initializeAudio();
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}; 