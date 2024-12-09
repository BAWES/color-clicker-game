class WhaleSound {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  private initContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 0.3; // Adjust volume
    }
  }

  playWhaleCall(frequency = 100) {
    this.initContext();
    if (!this.context || !this.gainNode) return;

    // Create oscillators for the whale sound
    const mainOsc = this.context.createOscillator();
    const modulatorOsc = this.context.createOscillator();
    const modulatorGain = this.context.createGain();
    
    // Connect the modulator
    modulatorOsc.connect(modulatorGain);
    modulatorGain.connect(mainOsc.frequency);
    
    // Set up the main oscillator
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(frequency, this.context.currentTime);
    
    // Set up the modulator
    modulatorOsc.type = 'sine';
    modulatorOsc.frequency.setValueAtTime(2, this.context.currentTime);
    modulatorGain.gain.setValueAtTime(50, this.context.currentTime);
    
    // Create envelope for whale-like sound
    const envelope = this.context.createGain();
    envelope.connect(this.gainNode);
    mainOsc.connect(envelope);
    
    // Shape the envelope for a whale-like sound
    const now = this.context.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.7, now + 0.1);
    envelope.gain.exponentialRampToValueAtTime(0.01, now + 2);
    
    // Frequency modulation for whale-like effect
    mainOsc.frequency.setValueAtTime(frequency, now);
    mainOsc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.5);
    mainOsc.frequency.exponentialRampToValueAtTime(frequency * 0.8, now + 2);
    
    // Start the oscillators
    mainOsc.start(now);
    modulatorOsc.start(now);
    
    // Stop the oscillators
    mainOsc.stop(now + 2);
    modulatorOsc.stop(now + 2);
  }

  playWhaleClick() {
    this.initContext();
    if (!this.context || !this.gainNode) return;

    // Create oscillator for click sound
    const osc = this.context.createOscillator();
    const clickEnvelope = this.context.createGain();
    
    osc.connect(clickEnvelope);
    clickEnvelope.connect(this.gainNode);
    
    // Set up the oscillator
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
    
    // Shape the envelope for a click sound
    const now = this.context.currentTime;
    clickEnvelope.gain.setValueAtTime(0, now);
    clickEnvelope.gain.linearRampToValueAtTime(0.3, now + 0.005);
    clickEnvelope.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playMilestone() {
    // Play a sequence of whale calls for milestones
    const frequencies = [100, 150, 200];
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playWhaleCall(freq), i * 500);
    });
  }
}

export const whaleSound = new WhaleSound(); 