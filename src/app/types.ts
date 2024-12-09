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
    color: '#8b5cf6',
  },
  autoClicker: {
    basePrice: 50,
    priceScale: 1.2,
    effect: 0.1,
    description: "Automatically generates points every second",
    details: "Each level adds 0.1 points per second. This is multiplied by your multiplier.",
    color: '#3b82f6',
  },
  multiplier: {
    basePrice: 100,
    priceScale: 1.3,
    effect: 0.5,
    description: "Multiplies ALL points gained by 50%",
    details: "Each level adds a 50% multiplier to all points gained, including auto-clicker.",
    color: '#10b981',
  },
  comboMaster: {
    basePrice: 200,
    priceScale: 1.25,
    effect: 0.2,
    description: "Improves combo duration and power by 20%",
    details: "Each level increases combo duration and makes combos more powerful.",
    color: '#f59e0b',
  },
  criticalClick: {
    basePrice: 150,
    priceScale: 1.35,
    effect: 0.1,
    description: "10% chance for 2x critical hits",
    details: "Each level adds 10% chance for clicks to deal double damage.",
    color: '#ef4444',
  },
  colorMastery: {
    basePrice: 300,
    priceScale: 1.4,
    effect: 0.15,
    description: "Gain bonus points for unique colors",
    details: "Each level increases the bonus you get for collecting unique colors.",
    color: '#ec4899',
  },
} as const; 