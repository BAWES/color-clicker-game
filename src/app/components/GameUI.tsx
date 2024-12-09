import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GameState, UPGRADES } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface GameUIProps {
  gameState: GameState;
  buyUpgrade: (type: keyof typeof UPGRADES) => void;
  calculateUpgradePrice: (type: keyof typeof UPGRADES, level: number) => number;
}

function MobileTopBar({ gameState, hasAvailableUpgrades, onOpenUpgrades }: {
  gameState: GameState;
  hasAvailableUpgrades: boolean;
  onOpenUpgrades: () => void;
}) {
  return (
    <div className="mobile-top-bar">
      <div className="mobile-stats">
        <div className="mobile-stat points">
          <span className="value">{Math.floor(gameState.points).toLocaleString()}</span>
          <span className="label">Points</span>
        </div>
        
        <div className="mobile-stat level">
          <div className="level-info">
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
          Upgrades Available
        </motion.button>
      )}
    </div>
  );
}

function DesktopUI({ gameState, buyUpgrade, calculateUpgradePrice }: GameUIProps) {
  return (
    <motion.div 
      className="game-ui-container"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="stats-panel">
        <motion.div 
          className="stat-item points"
          whileHover={{ x: 5 }}
        >
          <span className="label">Points</span>
          <span className="value">{Math.floor(gameState.points).toLocaleString()}</span>
        </motion.div>
        
        <motion.div 
          className="stat-item level"
          whileHover={{ x: 5 }}
        >
          <span className="label">Level {gameState.level}</span>
          <div className="exp-bar">
            <div 
              className="exp-fill" 
              style={{ 
                width: `${(gameState.experience / gameState.experienceToNext) * 100}%` 
              }} 
            />
          </div>
        </motion.div>

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

      <div className="upgrades-panel">
        {Object.entries(UPGRADES).map(([type, info]) => {
          const currentLevel = gameState.upgrades[type as keyof typeof UPGRADES];
          const cost = calculateUpgradePrice(type as keyof typeof UPGRADES, currentLevel);
          const canAfford = gameState.points >= cost;
          
          return (
            <motion.button
              key={type}
              className={`upgrade-item ${!canAfford ? 'disabled' : ''}`}
              onClick={() => buyUpgrade(type as keyof typeof UPGRADES)}
              whileHover={canAfford ? { x: 5 } : {}}
              whileTap={canAfford ? { scale: 0.98 } : {}}
              style={{
                '--upgrade-color': info.color
              } as React.CSSProperties}
            >
              <div className="upgrade-content">
                <h3 className="upgrade-title">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="upgrade-description">{info.description}</p>
                <div className="upgrade-footer">
                  <span className="level">Level {currentLevel}</span>
                  <span className="cost">{cost.toLocaleString()}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function GameUI({ gameState, buyUpgrade, calculateUpgradePrice }: GameUIProps) {
  const [isUpgradesOpen, setUpgradesOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const hasAvailableUpgrades = Object.entries(UPGRADES).some(([type]) => {
    const currentLevel = gameState.upgrades[type as keyof typeof UPGRADES];
    const cost = calculateUpgradePrice(type as keyof typeof UPGRADES, currentLevel);
    return gameState.points >= cost;
  });

  if (isMobile) {
    return (
      <>
        <MobileTopBar
          gameState={gameState}
          hasAvailableUpgrades={hasAvailableUpgrades}
          onOpenUpgrades={() => setUpgradesOpen(true)}
        />
        
        <AnimatePresence>
          {isUpgradesOpen && (
            <motion.div
              className="mobile-upgrades-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="panel-header">
                <h2>Upgrades</h2>
                <button 
                  className="close-button"
                  onClick={() => setUpgradesOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="upgrades-list">
                {Object.entries(UPGRADES).map(([type, info]) => {
                  const currentLevel = gameState.upgrades[type as keyof typeof UPGRADES];
                  const cost = calculateUpgradePrice(type as keyof typeof UPGRADES, currentLevel);
                  const canAfford = gameState.points >= cost;
                  
                  return (
                    <motion.button
                      key={type}
                      className={`upgrade-item ${!canAfford ? 'disabled' : ''}`}
                      onClick={() => buyUpgrade(type as keyof typeof UPGRADES)}
                      whileTap={canAfford ? { scale: 0.98 } : {}}
                      style={{
                        '--upgrade-color': info.color
                      } as React.CSSProperties}
                    >
                      <div className="upgrade-content">
                        <h3 className="upgrade-title">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <p className="upgrade-description">{info.description}</p>
                        <div className="upgrade-footer">
                          <span className="level">Level {currentLevel}</span>
                          <span className="cost">{cost.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return <DesktopUI gameState={gameState} buyUpgrade={buyUpgrade} calculateUpgradePrice={calculateUpgradePrice} />;
} 