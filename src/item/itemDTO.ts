import { Item } from './Item';

export class ItemDTO {
  id: string;
  emoji: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  price: number;

  constructor(item: Item) {
    this.id = item.getId();
    this.emoji = item.getEmoji();
    this.name = item.getName();
    this.type = item.getType();
    this.rarity = item.getRarity();
    this.description = item.getDescription();
    this.price = item.getPrice();
  }

  static fromDTO(itemDTO: ItemDTO): Item {
    const item = new Item(
      itemDTO.id,
      itemDTO.emoji,
      itemDTO.name,
      itemDTO.type,
      itemDTO.rarity,
      itemDTO.description,
      itemDTO.price
    );

    return item;
  }
}
