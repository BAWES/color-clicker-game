'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import BlobScene from './components/BlobScene';
import GameUI from './components/GameUI';
import './styles/game.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeEvent } from '@react-three/fiber';
import { whaleSound, initializeAudio } from '@/utils/sounds';
import { storage } from '@/utils/storage';

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface Position {
  x: number;
  y: number;
}

interface GameState {
  points: number;
  pointsPerClick: number;
  level: number;
  experience: number;
  experienceToNext: number;
  combo: number;
  comboTimer: number | null;
  upgrades: {
    clickPower: number;
    autoClicker: number;
    multiplier: number;
    comboMaster: number;
    criticalClick: number;
    colorMastery: number;
  };
  achievements: {
    totalClicks: number;
    maxCombo: number;
    colorsUnlocked: Set<string>;
  };
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  timestamp: number;
  isCritical: boolean;
  isCombo: boolean;
  isMega: boolean;
  completed?: boolean;
}

const UPGRADES = {
  clickPower: {
    basePrice: 10,
    priceScale: 1.15,
    effect: 1,
    description: "Increases points per click by +1",
    details: "Each level adds 1 to your base click power. This is multiplied by other bonuses.",
    color: "purple",
  },
  autoClicker: {
    basePrice: 50,
    priceScale: 1.2,
    effect: 0.1,
    description: "Automatically generates points every second",
    details: "Each level adds 0.1 points per second. This is multiplied by your multiplier.",
    color: "blue",
  },
  multiplier: {
    basePrice: 100,
    priceScale: 1.3,
    effect: 0.5,
    description: "Multiplies ALL points gained by 50%",
    details: "Each level adds a 50% multiplier to all points gained, including auto-clicker.",
    color: "green",
  },
  comboMaster: {
    basePrice: 200,
    priceScale: 1.25,
    effect: 0.2,
    description: "Improves combo duration and power by 20%",
    details: "Each level increases combo duration and makes combos more powerful.",
    color: "yellow",
  },
  criticalClick: {
    basePrice: 150,
    priceScale: 1.35,
    effect: 0.1,
    description: "10% chance for 2x critical hits",
    details: "Each level adds 10% chance for clicks to deal double damage.",
    color: "red",
  },
  colorMastery: {
    basePrice: 300,
    priceScale: 1.4,
    effect: 0.15,
    description: "Gain bonus points for unique colors",
    details: "Each level increases the bonus you get for collecting unique colors.",
    color: "pink",
  },
};

// Sound parameters for different effects
const SOUND_EFFECTS = {
  click: {
    mainNote: { frequency: 880, duration: 0.1 }, // High A note
    harmonyNote: { frequency: 1318.5, duration: 0.08 }, // High E note
    sparkleNotes: [
      { frequency: 1760, duration: 0.03, delay: 0.08 }, // High A
      { frequency: 2093, duration: 0.03, delay: 0.11 }, // High C
      { frequency: 2637, duration: 0.03, delay: 0.14 }, // High E
    ]
  },
  milestone: {
    mainNote: { frequency: 440, duration: 0.3 }, // A4
    chordNotes: [
      { frequency: 554.37, duration: 0.4, delay: 0.1 }, // C#5
      { frequency: 659.25, duration: 0.4, delay: 0.2 }, // E5
      { frequency: 880, duration: 0.5, delay: 0.3 },    // A5
    ],
    sparkleNotes: [
      { frequency: 1760, duration: 0.1, delay: 0.4 },   // A6
      { frequency: 2093, duration: 0.1, delay: 0.5 },   // C7
      { frequency: 2637, duration: 0.1, delay: 0.6 },   // E7
    ]
  }
};

const MILESTONES = {
  points: [100, 1000, 10000, 100000],
  combo: [10, 25, 50, 100],
  level: [5, 10, 25, 50],
  colors: [10, 25, 50, 100]
};

export default function Home() {
  const [currentHSL, setCurrentHSL] = useState<HSL>({ h: 0, s: 100, l: 50 });
  const [glowKey, setGlowKey] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    points: 0,
    pointsPerClick: 1,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    combo: 0,
    comboTimer: null,
    upgrades: {
      clickPower: 0,
      autoClicker: 0,
      multiplier: 0,
      comboMaster: 0,
      criticalClick: 0,
      colorMastery: 0,
    },
    achievements: {
      totalClicks: 0,
      maxCombo: 0,
      colorsUnlocked: new Set(),
    },
  });
  const [floatingNumbers, setFloatingNumbers] = useState<Array<FloatingNumber>>([]);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const lastMousePos = useRef<Position | null>(null);
  const isMoving = useRef(false);
  const blobRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rotationRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const floatingNumberId = useRef(0);

  // Handle combo system
  useEffect(() => {
    if (gameState.comboTimer) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          combo: 0,
          comboTimer: null,
        }));
      }, 2000 + (gameState.upgrades.comboMaster * 200)); // Combo duration increases with combo master

      return () => clearTimeout(timer);
    }
  }, [gameState.comboTimer, gameState.upgrades.comboMaster]);

  // Auto-clicker effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.upgrades.autoClicker > 0) {
        const basePoints = UPGRADES.autoClicker.effect * gameState.upgrades.autoClicker;
        const withMultiplier = basePoints * (1 + gameState.upgrades.multiplier * UPGRADES.multiplier.effect);
        addPoints(withMultiplier);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.upgrades.autoClicker, gameState.upgrades.multiplier]);

  const addPoints = useCallback((amount: number) => {
    setGameState(prev => {
      const newPoints = prev.points + amount;
      const newExperience = prev.experience + amount;
      
      // Level up system
      let newLevel = prev.level;
      let newExpToNext = prev.experienceToNext;
      let newExp = newExperience;
      
      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(newExpToNext * 1.5);
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        experience: newExp,
        experienceToNext: newExpToNext,
      };
    });
  }, []);

  const calculateUpgradePrice = useCallback((type: keyof typeof UPGRADES, level: number) => {
    return Math.floor(UPGRADES[type].basePrice * Math.pow(UPGRADES[type].priceScale, level));
  }, []);

  const buyUpgrade = useCallback((type: keyof typeof UPGRADES) => {
    setGameState(prev => {
      const price = calculateUpgradePrice(type, prev.upgrades[type]);
      if (prev.points >= price) {
        const newState = {
          ...prev,
          points: prev.points - price,
          upgrades: {
            ...prev.upgrades,
            [type]: prev.upgrades[type] + 1
          }
        };

        // Update derived stats
        if (type === 'clickPower') {
          newState.pointsPerClick = 1 + (UPGRADES.clickPower.effect * newState.upgrades.clickPower);
        }

        return newState;
      }
      return prev;
    });
  }, [calculateUpgradePrice]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  const playRewardSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    // Create effects
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);

    // Main note (coin-like sound)
    const mainOsc = ctx.createOscillator();
    const mainGain = ctx.createGain();
    mainOsc.type = 'square';
    mainOsc.frequency.setValueAtTime(SOUND_EFFECTS.click.mainNote.frequency, ctx.currentTime);
    mainOsc.frequency.exponentialRampToValueAtTime(
      SOUND_EFFECTS.click.mainNote.frequency * 1.2,
      ctx.currentTime + SOUND_EFFECTS.click.mainNote.duration
    );
    mainGain.gain.setValueAtTime(0.7, ctx.currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + SOUND_EFFECTS.click.mainNote.duration);
    mainOsc.connect(mainGain);
    mainGain.connect(compressor);
    mainOsc.start();
    mainOsc.stop(ctx.currentTime + SOUND_EFFECTS.click.mainNote.duration);

    // Harmony note
    const harmonyOsc = ctx.createOscillator();
    const harmonyGain = ctx.createGain();
    harmonyOsc.type = 'sine';
    harmonyOsc.frequency.setValueAtTime(SOUND_EFFECTS.click.harmonyNote.frequency, ctx.currentTime);
    harmonyOsc.frequency.exponentialRampToValueAtTime(
      SOUND_EFFECTS.click.harmonyNote.frequency * 1.1,
      ctx.currentTime + SOUND_EFFECTS.click.harmonyNote.duration
    );
    harmonyGain.gain.setValueAtTime(0.3, ctx.currentTime);
    harmonyGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + SOUND_EFFECTS.click.harmonyNote.duration);
    harmonyOsc.connect(harmonyGain);
    harmonyGain.connect(compressor);
    harmonyOsc.start();
    harmonyOsc.stop(ctx.currentTime + SOUND_EFFECTS.click.harmonyNote.duration);

    // Sparkle notes
    SOUND_EFFECTS.click.sparkleNotes.forEach(note => {
      setTimeout(() => {
        const sparkleOsc = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime(note.frequency, ctx.currentTime);
        sparkleGain.gain.setValueAtTime(0.2, ctx.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.duration);
        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(compressor);
        sparkleOsc.start();
        sparkleOsc.stop(ctx.currentTime + note.duration);
      }, note.delay * 1000);
    });

  }, []);

  const playMilestoneSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Create master gain and compression
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Create reverb
    const convolver = ctx.createConvolver();
    const reverbTime = 2;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * reverbTime;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.3));
      }
    }
    convolver.buffer = impulse;
    convolver.connect(compressor);

    // Play main celebratory note
    const mainOsc = ctx.createOscillator();
    const mainGain = ctx.createGain();
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(SOUND_EFFECTS.milestone.mainNote.frequency, ctx.currentTime);
    mainGain.gain.setValueAtTime(0.7, ctx.currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + SOUND_EFFECTS.milestone.mainNote.duration);
    mainOsc.connect(mainGain);
    mainGain.connect(convolver);
    mainOsc.start();
    mainOsc.stop(ctx.currentTime + SOUND_EFFECTS.milestone.mainNote.duration);

    // Play chord notes
    SOUND_EFFECTS.milestone.chordNotes.forEach(note => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.duration);
        osc.connect(gain);
        gain.connect(convolver);
        osc.start();
        osc.stop(ctx.currentTime + note.duration);
      }, note.delay * 1000);
    });

    // Play sparkle notes
    SOUND_EFFECTS.milestone.sparkleNotes.forEach(note => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.duration);
        osc.connect(gain);
        gain.connect(compressor);
        osc.start();
        osc.stop(ctx.currentTime + note.duration);
      }, note.delay * 1000);
    });
  }, []);

  const hslToHex = ({ h, s, l }: HSL): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const generateNewColor = (x: number, y: number) => {
    const newHSL = { ...currentHSL };
    
    if (x > y) {
      newHSL.h = (newHSL.h + Math.floor(Math.random() * 60) + 30) % 360;
      newHSL.s = 100; // Maximum saturation
      newHSL.l = 60;  // Brighter luminance
    } else {
      newHSL.s = 100; // Keep saturation at maximum
      newHSL.l = Math.max(50, Math.min(70, newHSL.l + (Math.random() > 0.5 ? 10 : -10)));
    }

    setCurrentHSL(newHSL);
    return hslToHex(newHSL);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!blobRef.current) return;
    
    const rect = blobRef.current.getBoundingClientRect();
    const blobCenterX = rect.left + rect.width / 2;
    const blobCenterY = rect.top + rect.height / 2;
    
    const currentPos = {
      x: e.clientX,
      y: e.clientY
    };

    // Calculate distance from blob center
    const dx = currentPos.x - blobCenterX;
    const dy = currentPos.y - blobCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width;
    
    // Calculate interaction based on proximity to blob
    if (distance < maxDistance) {
      const interactionStrength = 1 - (distance / maxDistance);
      const angle = Math.atan2(dy, dx);
      
      // Calculate squish values with more natural deformation
      const squishFactor = 1 - interactionStrength * 0.15; // Reduced deformation
      const squishX = 100 - Math.abs(Math.cos(angle) * (1 - squishFactor) * 20);
      const squishY = 100 - Math.abs(Math.sin(angle) * (1 - squishFactor) * 20);
      
      // Calculate bending based on mouse position
      const bendAmount = interactionStrength * 15; // Max 15 degrees bend
      const bendAngle = angle * (180 / Math.PI);
      
      // Apply gentle rotation based on movement
      const rotationSpeed = 0.02;
      rotationRef.current += (dx * rotationSpeed * interactionStrength);
      
      // Apply all transformations
      document.documentElement.style.setProperty('--rotation', `${rotationRef.current}deg`);
      document.documentElement.style.setProperty('--squish-x', String(squishX));
      document.documentElement.style.setProperty('--squish-y', String(squishY));
      document.documentElement.style.setProperty('--bend-amount', String(bendAmount));
      document.documentElement.style.setProperty('--bend-angle', `${bendAngle}deg`);
      document.documentElement.style.setProperty('--touch-glow', String(interactionStrength * 0.3));
      
      // Add slight movement
      const nudgeFactor = 0.1;
      const nudgeX = dx * nudgeFactor * interactionStrength;
      const nudgeY = dy * nudgeFactor * interactionStrength;
      document.documentElement.style.setProperty('--nudge-x', `${nudgeX}px`);
      document.documentElement.style.setProperty('--nudge-y', `${nudgeY}px`);
    } else {
      // Reset transformations when far from blob
      document.documentElement.style.setProperty('--squish-x', '100');
      document.documentElement.style.setProperty('--squish-y', '100');
      document.documentElement.style.setProperty('--bend-amount', '0');
      document.documentElement.style.setProperty('--touch-glow', '0');
      document.documentElement.style.setProperty('--nudge-x', '0px');
      document.documentElement.style.setProperty('--nudge-y', '0px');
    }

    lastMousePos.current = currentPos;
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    
    // Get screen coordinates from the native event
    const screenX = e.nativeEvent.clientX;
    const screenY = e.nativeEvent.clientY;
    
    // Convert Three.js coordinates to screen coordinates
    const x = (e.point.x + 1) * 50; // Convert from [-1,1] to [0,100]
    const y = (e.point.y + 1) * 50;
    
    const newColor = generateNewColor(x, y);
    document.documentElement.style.setProperty('--blob-color', newColor);
    setGlowKey(prev => prev + 1);

    // Start click animation
    setIsClicking(true);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicking(false);
    }, 200);

    // Game logic
    setGameState(prev => {
      // Update achievements
      const newAchievements = {
        ...prev.achievements,
        totalClicks: prev.achievements.totalClicks + 1,
        colorsUnlocked: new Set(
          Array.isArray(prev.achievements.colorsUnlocked)
            ? [...prev.achievements.colorsUnlocked, newColor]
            : [...Array.from(prev.achievements.colorsUnlocked), newColor]
        )
      };

      // Calculate combo
      const newCombo = prev.combo + 1;
      const comboMultiplier = 1 + (newCombo * 0.1 * (1 + prev.upgrades.comboMaster * UPGRADES.comboMaster.effect));
      
      // Calculate critical hit
      const criticalChance = prev.upgrades.criticalClick * UPGRADES.criticalClick.effect;
      const isCritical = Math.random() < criticalChance;
      const criticalMultiplier = isCritical ? 2 : 1;

      // Calculate color mastery bonus
      const colorBonus = 1 + (prev.upgrades.colorMastery * UPGRADES.colorMastery.effect * (newAchievements.colorsUnlocked.size / 100));

      // Calculate final points
      const basePoints = prev.pointsPerClick * criticalMultiplier * comboMultiplier * colorBonus;
      const withMultiplier = basePoints * (1 + prev.upgrades.multiplier * UPGRADES.multiplier.effect);

      // Add floating number with screen coordinates
      setFloatingNumbers(prevNumbers => [...prevNumbers, {
        id: floatingNumberId.current++,
        value: withMultiplier,
        x: screenX,
        y: screenY,
        timestamp: Date.now(),
        isCritical,
        isCombo: newCombo > 10 && !isCritical,
        isMega: withMultiplier > prev.pointsPerClick * 10,
      }]);

      // Calculate experience and level
      const newPoints = prev.points + withMultiplier;
      const newExperience = prev.experience + withMultiplier;
      let currentLevel = prev.level;
      let currentExpToNext = prev.experienceToNext;
      let remainingExp = newExperience;
      
      while (remainingExp >= currentExpToNext) {
        remainingExp -= currentExpToNext;
        currentLevel++;
        currentExpToNext = Math.floor(currentExpToNext * 1.5);
      }

      // Check milestones
      const hitMilestone = 
        MILESTONES.points.some(m => prev.points < m && newPoints >= m) ||
        MILESTONES.combo.some(m => prev.combo < m && newCombo >= m) ||
        MILESTONES.level.some(m => prev.level < m && currentLevel >= m) ||
        MILESTONES.colors.some(m => prev.achievements.colorsUnlocked.size < m && newAchievements.colorsUnlocked.size >= m);

      // Play appropriate sound
      if (hitMilestone) {
        whaleSound.playMilestone(currentLevel);
      } else {
        whaleSound.playWhaleCall(currentLevel);
      }

      return {
        ...prev,
        points: newPoints,
        combo: newCombo,
        level: currentLevel,
        experience: remainingExp,
        experienceToNext: currentExpToNext,
        comboTimer: Date.now(),
        achievements: {
          ...newAchievements,
          maxCombo: Math.max(newAchievements.maxCombo, newCombo),
        },
      };
    });
    
    initAudio();
  }, [generateNewColor, initAudio, playRewardSound, playMilestoneSound]);

  // Remove the cleanup interval and handle cleanup in the animation completion
  const handleAnimationComplete = useCallback((id: number) => {
    setFloatingNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  // Load saved game on mount
  useEffect(() => {
    const savedState = storage.loadGame();
    if (savedState) {
      setGameState(savedState);
    }
  }, []);

  // Save game when state changes
  useEffect(() => {
    storage.saveGame(gameState);
  }, [gameState]);

  // Initialize audio on first interaction
  useEffect(() => {
    const initAudio = async (event: Event) => {
      event.preventDefault();
      
      if (!audioInitialized) {
        const success = await initializeAudio();
        if (success) {
          setAudioInitialized(true);
          console.log('Audio initialized successfully');
        }
      }
    };

    // Add event listeners for both touch and click
    const events = ['touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, [audioInitialized]);

  // Handle audio resumption on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioInitialized) {
        whaleSound.playWhaleCall(gameState.level);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioInitialized, gameState.level]);

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden">
      <div className="absolute inset-0">
        <BlobScene
          color={hslToHex(currentHSL)}
          isClicking={isClicking}
          level={gameState.level}
          onClick={handleClick}
        />
      </div>
      
      <GameUI
        gameState={gameState}
        buyUpgrade={buyUpgrade}
        calculateUpgradePrice={calculateUpgradePrice}
      />

      <AnimatePresence mode="sync">
        {floatingNumbers.map(number => (
          <motion.div
            key={number.id}
            className={`floating-number ${number.isCritical ? 'critical' : ''} ${number.isCombo ? 'combo' : ''} ${number.isMega ? 'mega' : ''}`}
            style={{
              position: 'fixed',
              left: number.x,
              top: number.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              willChange: 'transform, opacity'
            }}
            initial={{ 
              opacity: 0,
              y: 0
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [-20, -60, -100, -120],
              transition: {
                duration: 0.6,
                times: [0, 0.1, 0.8, 1],
                ease: "linear"
              }
            }}
            onAnimationComplete={() => handleAnimationComplete(number.id)}
          >
            {Math.floor(number.value).toLocaleString()}
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}
