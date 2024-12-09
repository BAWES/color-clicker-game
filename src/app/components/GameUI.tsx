import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GameState, UPGRADES } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

const POWER_SYMBOLS = {
  clickPower: '⚡',
  autoClicker: '🔄',
  multiplier: '✨',
  comboMaster: '🔗',
  criticalClick: '💥',
  colorMastery: '🎨',
};

const CURRENCY_ICON = '💎';

interface PowerAnnouncement {
  type: keyof typeof UPGRADES;
  level: number;
}

function PowerAnnouncementDisplay({ announcement, onComplete }: {
  announcement: PowerAnnouncement;
  onComplete: () => void;
}) {
  const info = UPGRADES[announcement.type];
  const symbol = POWER_SYMBOLS[announcement.type];
  const name = announcement.type.replace(/([A-Z])/g, ' $1').trim();

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [announcement.type, announcement.level, onComplete]);

  return (
    <motion.div 
      className="power-announcement"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{
        '--upgrade-color': info.color
      } as React.CSSProperties}
    >
      <motion.div 
        className="announcement-icon"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ duration: 0.5 }}
      >
        {symbol}
      </motion.div>
      <motion.div className="announcement-title">
        {name}
      </motion.div>
      <motion.div className="announcement-description">
        Level {announcement.level} - {info.description}
      </motion.div>
    </motion.div>
  );
}

function GameHeader({ gameState }: { gameState: GameState }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="game-header">
      <div className="header-stats">
        <div className="stat-group">
          <div className="stat points">
            <span className="value">{mounted ? Math.floor(gameState.points).toLocaleString() : '0'}</span>
            <span className="label">Points</span>
          </div>
          
          <div className="stat level">
            <span className="value">Lvl {mounted ? gameState.level : '1'}</span>
            <div className="exp-bar">
              <div 
                className="exp-fill" 
                style={{ 
                  width: mounted ? `${(gameState.experience / gameState.experienceToNext) * 100}%` : '0%'
                }} 
              />
            </div>
          </div>
        </div>

        {mounted && gameState.combo > 1 && (
          <motion.div 
            className="combo-counter"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            x{gameState.combo.toFixed(1)}
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface GameUIProps {
  gameState: GameState;
  buyUpgrade: (type: keyof typeof UPGRADES) => void;
  calculateUpgradePrice: (type: keyof typeof UPGRADES, level: number) => number;
}

function PowersGrid({ gameState, buyUpgrade, calculateUpgradePrice, onPowerSelected }: GameUIProps & {
  onPowerSelected: (type: keyof typeof UPGRADES, level: number) => void;
}) {
  return (
    <div className="powers-grid">
      {Object.entries(UPGRADES).map(([type, info]) => {
        const currentLevel = gameState.upgrades[type as keyof typeof UPGRADES];
        const cost = calculateUpgradePrice(type as keyof typeof UPGRADES, currentLevel);
        const canAfford = gameState.points >= cost;
        
        return (
          <motion.button
            key={type}
            className={`power-icon ${!canAfford ? 'disabled' : ''}`}
            onClick={() => {
              if (canAfford) {
                buyUpgrade(type as keyof typeof UPGRADES);
                onPowerSelected(type as keyof typeof UPGRADES, currentLevel + 1);
              }
            }}
            whileTap={canAfford ? { scale: 0.95 } : {}}
            style={{
              '--upgrade-color': info.color
            } as React.CSSProperties}
          >
            <span className="power-symbol">
              {POWER_SYMBOLS[type as keyof typeof POWER_SYMBOLS]}
            </span>
            <div className="power-cost">
              <span className="cost-icon">{CURRENCY_ICON}</span>
              {cost.toLocaleString()}
            </div>
            <div className="power-level">
              Level {currentLevel}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function GameUI({ gameState, buyUpgrade, calculateUpgradePrice }: GameUIProps) {
  const [announcement, setAnnouncement] = useState<PowerAnnouncement | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handlePowerSelected = (type: keyof typeof UPGRADES, level: number) => {
    setAnnouncement({ type, level });
  };

  return (
    <>
      <GameHeader gameState={gameState} />

      <motion.div 
        className="game-ui-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <PowersGrid 
          gameState={gameState}
          buyUpgrade={buyUpgrade}
          calculateUpgradePrice={calculateUpgradePrice}
          onPowerSelected={handlePowerSelected}
        />
      </motion.div>

      <AnimatePresence>
        {announcement && (
          <PowerAnnouncementDisplay 
            announcement={announcement}
            onComplete={() => setAnnouncement(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 