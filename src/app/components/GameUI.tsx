import { motion } from 'framer-motion';
import { useState } from 'react';
import { GameState, UPGRADES } from '../types';

interface GameUIProps {
  gameState: GameState;
  buyUpgrade: (type: keyof typeof UPGRADES) => void;
  calculateUpgradePrice: (type: keyof typeof UPGRADES, level: number) => number;
}

export default function GameUI({ gameState, buyUpgrade, calculateUpgradePrice }: GameUIProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      className={`game-ui-container ${isCollapsed ? 'collapsed' : ''}`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button 
        className="toggle-button"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? '→' : '←'}
      </button>

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