export class Item {
  id: string;
  emoji: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  price: number;

  constructor(
    id: string,
    emoji: string,
    name: string,
    type: string,
    rarity: string,
    description: string,
    price: number
  ) {
    this.id = id;
    this.emoji = emoji;
    this.name = name;
    this.type = type;
    this.rarity = rarity;
    this.description = description;
    this.price = price;
  }

  getId() {
    return this.id;
  }
  setId(id: string) {
    this.id = id;
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
  getDescription() {
    return this.description;
  }
  setDescription(description: string) {
    this.description = description;
  }
  getPrice() {
    return this.price;
  }
  setPrice(price: number) {
    this.price = price;
  }
}
