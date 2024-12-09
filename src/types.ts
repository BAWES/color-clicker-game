export interface GameState {
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

export const UPGRADES = {
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
  // ... other upgrades
}; 