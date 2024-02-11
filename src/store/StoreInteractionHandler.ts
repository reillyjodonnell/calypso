import { ButtonInteraction, CacheType } from 'discord.js';
import { GoldRepository } from '../gold/GoldRepository';
import { InventoryRepository } from '../inventory/InventoryRepository';
import { StoreRepository } from './StoreRepository';
import { ItemRepository } from '../item/ItemRepository';
import { Weapon } from '../item/weapon';
import { Item } from '../item/Item';

export class StoreInteractionHandler {
  constructor(
    private goldRepository: GoldRepository,
    private inventoryRepository: InventoryRepository,
    private storeRepository: StoreRepository,
    private itemRepository: ItemRepository
  ) {}

  async handleStorePurchase(
    interaction: ButtonInteraction<CacheType>,
    id: string
  ) {
    // Get the user's ID
    const userId = interaction.user.id;

    // fetch the items from the database
    const weapons = await this.storeRepository.getWeapons();
    const items = await this.itemRepository.getItems();

    // Get the item's price
    const weapon = weapons.find((weapon) => weapon.id === id);
    const item = items.find((item) => item.id === id);

    // If the item is not found, reply with a message
    if (!weapon && !item) {
      await interaction.reply({
        content: 'Item/weapon not found.',
        ephemeral: true,
      });
      return;
    }
    if (weapon) {
      await this.handleWeaponPurchase({ weapon, userId, interaction });
      await interaction.reply({
        content: `You have purchased a ${weapon.name} for ${weapon.price} gold.`,
        ephemeral: true,
      });
      return;
    }
    if (item) {
      await this.handleItemPurchase({ item, userId, interaction });
      await interaction.reply({
        content: `You have purchased a ${item.name} for ${item.price} gold.`,
        ephemeral: true,
      });
    }
  }

  async handleWeaponPurchase({
    weapon,
    userId,
    interaction,
  }: {
    weapon: Weapon;
    userId: string;
    interaction: ButtonInteraction<CacheType>;
  }) {
    const { price } = weapon;

    // Get the user's gold
    const userGold = await this.goldRepository.getGold(userId);

    // If the user does not have enough gold, reply with a message
    if (userGold < price) {
      await interaction.reply({
        content: 'You do not have enough gold to purchase this item.',
        ephemeral: true,
      });
      return;
    }

    // If the user has enough gold, proceed with the purchase
    await this.goldRepository.spendGold(userId, price);
    await this.inventoryRepository.awardWeapon(userId, weapon);

    return { price, name: weapon.name };
  }

  async handleItemPurchase({
    item,
    userId,
    interaction,
  }: {
    item: Item;
    userId: string;
    interaction: ButtonInteraction<CacheType>;
  }) {
    const { price } = item;

    // Get the user's gold
    const userGold = await this.goldRepository.getGold(userId);

    // If the user does not have enough gold, reply with a message
    if (userGold < price) {
      await interaction.reply({
        content: 'You do not have enough gold to purchase this item.',
        ephemeral: true,
      });
      return;
    }

    // If the user has enough gold, proceed with the purchase
    await this.goldRepository.spendGold(userId, price);
    await this.inventoryRepository.awardItem(userId, item);

    return { price, name: item.name };
  }
}
