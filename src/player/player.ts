import { ItemEffect } from '../item/ItemEffects';

export const MAX_HEALTH = 14;
export class Player {
  private id: string;
  private maxHealth = MAX_HEALTH;
  private health = MAX_HEALTH;
  private ac = 11;
  private numberOfHeals = 2;
  private healsUsed = 0;
  private targetId: string | null = null;
  // may include multiple numbers
  private criticalHit: number[] = [20];
  // may include multiple numbers
  private criticalFail: number[] = [1];
  // may also include +1 for damage modifier
  private rollForDamage: string = '1d6';
  // may also include +1 for to hit modifier
  private rollToHit: string = '1d20';

  private effects: ItemEffect[] = [];

  constructor(id: string) {
    this.id = id;
  }
  public addEffect(effect: ItemEffect) {
    this.effects.push(effect);
  }
  public getEffects() {
    return this.effects;
  }
  public removeEffect(effect: ItemEffect) {
    this.effects = this.effects.filter((e) => e !== effect);
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

  public getCriticalHit() {
    return this.criticalHit;
  }
  public setCriticalHit(criticalHit: number[]) {
    this.criticalHit = criticalHit;
  }
  public getCriticalFail() {
    return this.criticalFail;
  }
  public setCriticalFail(criticalFail: number[]) {
    this.criticalFail = criticalFail;
  }
  public getDamage() {
    return this.rollForDamage;
  }
  public setDamage(rollForDamage: string) {
    this.rollForDamage = rollForDamage;
  }
  public getRollToHit() {
    return this.rollToHit;
  }
  public setRollToHit(rollToHit: string) {
    this.rollToHit = rollToHit;
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
