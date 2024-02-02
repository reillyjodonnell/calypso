import { ButtonInteraction, CacheType } from 'discord.js';
import { GoldRepository } from '../gold/GoldRepository';
import { InventoryRepository } from '../inventory/InventoryRepository';
import { StoreRepository } from './StoreRepository';

export class StoreInteractionHandler {
  constructor(
    private goldRepository: GoldRepository,
    private inventoryRepository: InventoryRepository,
    private storeRepository: StoreRepository
  ) {}

  async handleStorePurchase(
    interaction: ButtonInteraction<CacheType>,
    id: string
  ) {
    // TODO MAP THE IDs 1-7 TO THE CORRESPONDING ITEMS (THE IDS WONT MATCH)

    // buy_2 -> 2

    // Get the user's ID
    const userId = interaction.user.id;

    // fetch the items from the database
    const items = await this.storeRepository.getItems();

    // Get the item's price
    const item = items.find((item) => item.id === id);
    if (!item) {
      await interaction.reply({
        content: 'This item is not available.',
        ephemeral: true,
      });
      return;
    }
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
    await interaction.reply({
      content: `You have purchased a ${item.name} for ${price} gold.`,
      ephemeral: true,
    });
  }
}
