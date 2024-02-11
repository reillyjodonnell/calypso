type ItemEffectName =
  | 'Smoke Bomb'
  | 'Mirror Shield'
  | 'Risky Potion'
  | "Healer's Herb"
  | 'Sudden Strike';

export function isValidItemEffectName(name: string): name is ItemEffectName {
  return [
    'Smoke Bomb',
    'Mirror Shield',
    'Risky Potion',
    "Healer's Herb",
    'Sudden Strike',
  ].includes(name);
}

export class ItemEffect {
  private name: ItemEffectName;
  private turnsRemaining: number;

  constructor(name: ItemEffectName) {
    this.name = name;
    if (name === "Healer's Herb") {
      this.turnsRemaining = 4;
    } else {
      this.turnsRemaining = 0;
    }
  }

  getName(): ItemEffectName {
    return this.name;
  }

  getTurnsRemaining(): number {
    return this.turnsRemaining;
  }

  decrementTurns() {
    if (this.turnsRemaining > 0) {
      this.turnsRemaining -= 1;
    }
  }

  // Additional methods if necessary...
}
