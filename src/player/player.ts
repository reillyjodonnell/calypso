export const MAX_HEALTH = 14;
export class Player {
  private id: string;
  private maxHealth = MAX_HEALTH;
  private health = MAX_HEALTH;
  private ac = 11;
  private numberOfHeals = 2;
  private healsUsed = 0;
  private targetId: string | null = null;

  constructor(id: string) {
    this.id = id;
  }
  public getId() {
    return this.id;
  }
  public getMaxHealth() {
    return this.maxHealth;
  }
  public setMaxHealth(maxHealth: number) {
    this.maxHealth = maxHealth;
  }
  public getHealth() {
    return this.health;
  }
  public setHealth(health: number) {
    this.health = health;
  }
  public getAC() {
    return this.ac;
  }
  public setAC(ac: number) {
    this.ac = ac;
  }
  public getNumberOfHeals() {
    return this.numberOfHeals;
  }
  public setNumberOfHeals(numberOfHeals: number) {
    this.numberOfHeals = numberOfHeals;
  }
  public getHealsUsed() {
    return this.healsUsed;
  }
  public setHealsUsed(healsUsed: number) {
    this.healsUsed = healsUsed;
  }
  public getTargetId() {
    return this.targetId;
  }
  public setTargetId(targetId: string) {
    this.targetId = targetId;
  }

  // New method to clear the target
  public clearTarget() {
    this.targetId = null;
  }

  public hurt(damage: number) {
    // make sure it doesn't go below 0
    if (this.health - damage < 0) {
      this.health = 0;
      return;
    }
    this.health -= damage;
  }
  public heal(heal: number) {
    // make sure we have heals left
    if (this.healsUsed >= this.numberOfHeals) {
      return false;
    }
    // make sure it doesn't exceed max health
    this.health = Math.min(this.health + heal, MAX_HEALTH);
    this.healsUsed++;
    return true; // Heal was successful
  }

  public isPlayerDead() {
    return this.health <= 0;
  }

  public hasHealsLeft() {
    return this.healsUsed < this.numberOfHeals;
  }
}
