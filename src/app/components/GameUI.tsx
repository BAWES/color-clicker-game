import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { GameState, UPGRADES } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface GameUIProps {
  gameState: GameState;
  buyUpgrade: (type: keyof typeof UPGRADES) => void;
  calculateUpgradePrice: (type: keyof typeof UPGRADES, level: number) => number;
}

const POWER_SYMBOLS = {
  clickPower: '⚡',
  autoClicker: '🔄',
  multiplier: '✨',
  comboMaster: '🔗',
  criticalClick: '💥',
  colorMastery: '🎨',
};

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

  return (
    <motion.div 
      className="power-announcement"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
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

function GameHeader({ gameState, hasAvailableUpgrades, onOpenUpgrades }: {
  gameState: GameState;
  hasAvailableUpgrades: boolean;
  onOpenUpgrades: () => void;
}) {
  return (
    <div className="game-header">
      <div className="header-stats">
        <div className="stat-group">
          <div className="stat points">
            <span className="value">{Math.floor(gameState.points).toLocaleString()}</span>
            <span className="label">Points</span>
          </div>
          
          <div className="stat level">
            <span className="value">Lvl {gameState.level}</span>
            <div className="exp-bar">
              <div 
                className="exp-fill" 
                style={{ 
                  width: `${(gameState.experience / gameState.experienceToNext) * 100}%` 
                }} 
              />
            </div>
          </div>
        </div>

        {gameState.combo > 1 && (
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
      
      {hasAvailableUpgrades && (
        <motion.button
          className="upgrade-notification"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenUpgrades}
        >
          <span className="notification-dot" />
          Powers
        </motion.button>
      )}
    </div>
  );
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
            <span className="power-level">Lv{currentLevel}</span>
            <span className="power-cost">{cost.toLocaleString()}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function GameUI({ gameState, buyUpgrade, calculateUpgradePrice }: GameUIProps) {
  const [isUpgradesPanelOpen, setIsUpgradesPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<PowerAnnouncement | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const hasAvailableUpgrades = Object.entries(UPGRADES).some(([type]) => {
    const currentLevel = gameState.upgrades[type as keyof typeof UPGRADES];
    const cost = calculateUpgradePrice(type as keyof typeof UPGRADES, currentLevel);
    return gameState.points >= cost;
  });

  const handlePowerSelected = (type: keyof typeof UPGRADES, level: number) => {
    setAnnouncement({ type, level });
    if (isMobile) {
      setIsUpgradesPanelOpen(false);
    }
  };

  return (
    <>
      <GameHeader 
        gameState={gameState}
        hasAvailableUpgrades={hasAvailableUpgrades}
        onOpenUpgrades={() => setIsUpgradesPanelOpen(true)}
      />

      <AnimatePresence>
        {announcement && (
          <PowerAnnouncementDisplay 
            announcement={announcement}
            onComplete={() => setAnnouncement(null)}
          />
        )}

        {isMobile ? (
          isUpgradesPanelOpen && (
            <motion.div
              className="mobile-upgrades-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="panel-header">
                <h2>Powers</h2>
                <button 
                  className="close-button"
                  onClick={() => setIsUpgradesPanelOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <PowersGrid 
                  gameState={gameState}
                  buyUpgrade={buyUpgrade}
                  calculateUpgradePrice={calculateUpgradePrice}
                  onPowerSelected={handlePowerSelected}
                />
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            className="game-ui-container"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PowersGrid 
              gameState={gameState}
              buyUpgrade={buyUpgrade}
              calculateUpgradePrice={calculateUpgradePrice}
              onPowerSelected={handlePowerSelected}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 