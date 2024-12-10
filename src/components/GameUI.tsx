  const handleUpgrade = (upgrade: keyof typeof UPGRADES) => {
    if (gameState.points >= getUpgradeCost(upgrade, gameState.upgrades[upgrade])) {
      const newLevel = gameState.upgrades[upgrade] + 1;
      const cost = getUpgradeCost(upgrade, gameState.upgrades[upgrade]);
      
      // Check for power upgrade achievements
      if (newLevel === 1) {
        whaleSound.playAchievement(); // First power
      } else if (newLevel === UPGRADES[upgrade].maxLevel) {
        whaleSound.playAchievement(); // Max level power
      }

      // Check if all powers are at level 10
      const allPowersLevel10 = Object.entries(gameState.upgrades).every(([key, level]) => {
        if (key === upgrade) return newLevel >= 10;
        return level >= 10;
      });
      if (allPowersLevel10) {
        whaleSound.playAchievement();
      }

      // Check if all powers are at max level
      const allPowersMaxLevel = Object.entries(gameState.upgrades).every(([key, level]) => {
        if (key === upgrade) return newLevel >= UPGRADES[key as keyof typeof UPGRADES].maxLevel;
        return level >= UPGRADES[key as keyof typeof UPGRADES].maxLevel;
      });
      if (allPowersMaxLevel) {
        whaleSound.playAchievement();
      }

      setGameState(prev => ({
        ...prev,
        points: prev.points - cost,
        upgrades: {
          ...prev.upgrades,
          [upgrade]: newLevel
        }
      }));
    }
  }; 