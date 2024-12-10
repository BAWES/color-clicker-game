class WhaleSound {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicVolume: GainNode | null = null;
  private clickTimes: number[] = [];
  private isPlaying: boolean = false;
  private fadeTimeout: NodeJS.Timeout | null = null;
  private basePlaybackRate: number = 0.4;
  private currentTime: number = 0;
  private lastUpdateTime: number = 0;

  async initializeAudio() {
    try {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.musicVolume = this.audioContext.createGain();

      // Set up compressor
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.001;
      this.compressor.release.value = 0.1;
      
      // Set up gain
      this.gainNode.gain.value = 0.7;
      this.musicVolume.gain.value = 0.3;
      
      // Connect nodes
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      this.musicVolume.connect(this.compressor);

      // Load the audio file
      try {
        console.log('Loading audio file...');
        const response = await fetch('/halo.mp3');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log('Audio file loaded, decoding...');
        this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        console.log('Audio decoded successfully');
        this.lastUpdateTime = this.audioContext.currentTime;
      } catch (error) {
        console.error('Failed to load audio file:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode | null {
    if (!this.audioContext || !this.compressor) return null;
    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  private async playSoundEffect(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.compressor) return;
    
    const osc = this.createOscillator(frequency, type);
    if (!osc) return;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = volume;
    
    osc.connect(gain);
    gain.connect(this.compressor);
    
    const now = this.audioContext.currentTime;
    osc.start(now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration);
  }

  async startBackgroundMusic(resumeTime: number = 0) {
    console.log('Starting background music...');
    if (!this.audioContext || !this.musicBuffer) {
      console.error('Audio context or buffer not ready');
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.musicSource) {
        try {
          this.musicSource.stop();
          this.musicSource.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      this.musicSource = this.audioContext.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      this.musicSource.playbackRate.value = this.basePlaybackRate;
      this.musicSource.connect(this.musicVolume!);
      
      const startTime = resumeTime % this.musicBuffer.duration;
      this.musicSource.start(0, startTime);
      this.isPlaying = true;
      this.lastUpdateTime = this.audioContext.currentTime;
      this.scheduleFadeOut();
    } catch (error) {
      console.error('Error starting background music:', error);
      this.isPlaying = false;
      this.musicSource = null;
    }
  }

  private scheduleFadeOut() {
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }

    this.fadeTimeout = setTimeout(() => {
      if (!this.musicVolume || !this.audioContext || !this.musicSource) return;
      
      // Save current position before fading
      const now = this.audioContext.currentTime;
      const elapsed = now - this.lastUpdateTime;
      this.currentTime += elapsed * this.musicSource.playbackRate.value;
      this.lastUpdateTime = now;
      
      // Gradual fade out and slow down to base speed
      this.musicSource.playbackRate.setTargetAtTime(this.basePlaybackRate, now, 1);
      this.musicVolume.gain.setTargetAtTime(0, now, 1);
      
      setTimeout(() => this.stopBackgroundMusic(), 3000);
    }, 5000);
  }

  stopBackgroundMusic() {
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (this.musicSource && this.audioContext) {
      try {
        // Save position before stopping
        const elapsed = this.audioContext.currentTime - this.lastUpdateTime;
        this.currentTime += elapsed * this.musicSource.playbackRate.value;
        
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch (error) {
        console.error('Error stopping music:', error);
      }
      this.musicSource = null;
    }
    this.isPlaying = false;
  }

  updateTempo() {
    const now = Date.now();
    this.clickTimes = [...this.clickTimes.filter(time => now - time < 1500), now];
    
    if (!this.isPlaying) {
      this.startBackgroundMusic(this.currentTime);
      return;
    }
    
    if (this.musicVolume && this.audioContext) {
      this.musicVolume.gain.setTargetAtTime(0.3, this.audioContext.currentTime, 0.1);
      this.scheduleFadeOut();
    }
    
    if (this.clickTimes.length >= 2 && this.musicSource && this.audioContext) {
      const intervals = this.clickTimes.slice(1).map((time, i) => 
        time - this.clickTimes[i]
      );
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Calculate clicks per second
      const clicksPerSecond = 1000 / averageInterval;
      
      // Calculate speed multiplier:
      // - Below 3 clicks/sec: stay at base rate
      // - Above 3 clicks/sec: scale exponentially
      let speedMultiplier;
      if (clicksPerSecond <= 3) {
        speedMultiplier = 1.0; // Stay at base rate
      } else {
        // Exponential scaling starting from 3 clicks/sec
        // (clicksPerSecond - 3) makes it start from 0 at 3 clicks/sec
        // 0.5 power makes it scale exponentially but not too aggressively
        const scaleFactor = Math.pow((clicksPerSecond - 3) / 3, 0.5);
        speedMultiplier = 1.0 + scaleFactor * 2; // Can reach up to 3x at very fast clicking
      }

      // Clamp the final multiplier
      speedMultiplier = Math.min(Math.max(speedMultiplier, 1.0), 3.0);
      const targetRate = this.basePlaybackRate * speedMultiplier;

      // Quick response to speed changes
      this.musicSource.playbackRate.setTargetAtTime(
        targetRate,
        this.audioContext.currentTime,
        0.1
      );

      // Track current position
      const elapsed = this.audioContext.currentTime - this.lastUpdateTime;
      this.currentTime += elapsed * this.musicSource.playbackRate.value;
      this.lastUpdateTime = this.audioContext.currentTime;
    }
  }

  playWhaleCall(level: number) {
    this.updateTempo(); // Update tempo on click
    // Quick click sound
    this.playSoundEffect(880, 0.1, 'square', 0.2);
  }

  playMilestone(level: number) {
    // Achievement sound
    this.playSoundEffect(440, 0.3, 'triangle', 0.3);
    // Harmony notes
    setTimeout(() => {
      this.playSoundEffect(554.37, 0.4, 'triangle', 0.2);
    }, 100);
    setTimeout(() => {
      this.playSoundEffect(659.25, 0.4, 'triangle', 0.2);
    }, 200);
  }

  playAchievement() {
    // Bell-like achievement sound
    this.playSoundEffect(784, 0.5, 'sine', 0.3);
    // Harmony notes
    setTimeout(() => {
      this.playSoundEffect(988, 0.4, 'sine', 0.2);
    }, 100);
    setTimeout(() => {
      this.playSoundEffect(1175, 0.3, 'sine', 0.15);
    }, 200);
  }
}

export const whaleSound = new WhaleSound();

export const initializeAudio = async () => {
  return await whaleSound.initializeAudio();
}; 