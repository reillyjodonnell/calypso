type ItemEffectName =
  | 'Smoke Bomb'
  | 'Mirror Shield'
  | 'Risky Potion'
  | "Healer's Herb"
  | 'Sudden Strike';

export class ItemEffect {
  private name: ItemEffectName;
  private turnsRemaining: number;

  constructor(name: ItemEffectName, turnsRemaining: number = 0) {
    this.name = name;
    this.turnsRemaining = turnsRemaining;
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
