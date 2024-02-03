import { Item } from './Item';

export class Weapon extends Item {
  private emoji: string;
  private damage: string;
  private rollToHit: string;
  private critHit: number[];
  private critFail: number[];
  private critChance: number;
  private critFailChance: number;

  constructor({
    id,
    name,
    description,
    type,
    rarity,
    price,
    emoji,
    damage,
    rollToHit,
    critHit,
    critFail,
    critChance,
    critFailChance,
  }: {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: string;
    price: number;
    emoji: string;
    damage: string;
    rollToHit: string;
    critHit: number[];
    critFail: number[];
    critChance: number;
    critFailChance: number;
  }) {
    super(id, name, description, type, rarity, price);
    this.emoji = emoji;
    this.damage = damage;
    this.rollToHit = rollToHit;
    this.critHit = critHit;
    this.critFail = critFail;
    this.critChance = critChance;
    this.critFailChance = critFailChance;
  }

  // Add methods to get and set the properties
  getId() {
    return this.id;
  }
  setId(id: string) {
    this.id = id;
  }

  getDescription() {
    return this.description;
  }
  setDescription(description: string) {
    this.description = description;
  }
  getEmoji() {
    return this.emoji;
  }
  setEmoji(emoji: string) {
    this.emoji = emoji;
  }
  getName() {
    return this.name;
  }
  setName(name: string) {
    this.name = name;
  }
  getType() {
    return this.type;
  }
  setType(type: string) {
    this.type = type;
  }
  getRarity() {
    return this.rarity;
  }
  setRarity(rarity: string) {
    this.rarity = rarity;
  }
  getDamage() {
    return this.damage;
  }
  setDamage(damage: string) {
    this.damage = damage;
  }
  getRollToHit() {
    return this.rollToHit;
  }
  setRollToHit(rollToHit: string) {
    this.rollToHit = rollToHit;
  }
  getCritHit() {
    return this.critHit;
  }
  setCritHit(critHit: number[]) {
    this.critHit = critHit;
  }
  getCritFail() {
    return this.critFail;
  }
  setCritFail(critFail: number[]) {
    this.critFail = critFail;
  }
  getCritChance() {
    return this.critChance;
  }
  setCritChance(critChance: number) {
    this.critChance = critChance;
  }
  getCritFailChance() {
    return this.critFailChance;
  }
  setCritFailChance(critFailChance: number) {
    this.critFailChance = critFailChance;
  }
  getPrice() {
    return this.price;
  }
  setPrice(price: number) {
    this.price = price;
  }
}
