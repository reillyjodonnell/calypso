import { ButtonInteraction, CacheType } from 'discord.js';
import { parseItemsButtonId } from './ItemsEmbed';
import { InventoryRepository } from '../inventory/InventoryRepository';
import { DiscordService } from '../discord/DiscordService';
import { DuelRepository } from '../duel/DuelRepository';
import { DUEL_NOT_FOUND, DuelService } from '../duel/DuelService';
import { getAllButtonOptions } from '../buttons';
import { PlayerRepository } from '../player/PlayerRepository';
import { DuelWinManager } from '../duel/DuelWinManager';
import { DuelCleanup } from '../duel/DuelCleanup';
import { ItemRepository } from './ItemRepository';

export class ItemInteractionHandler {
  private inventoryRepository: InventoryRepository;
  private discordService: DiscordService;
  private duelRepository: DuelRepository;
  private duelService: DuelService;
  private playerRepository: PlayerRepository;
  private duelWinManager: DuelWinManager;
  private duelCleanup: DuelCleanup;

  constructor({
    inventoryRepository,
    discordService,
    duelRepository,
    duelService,
    playerRepository,
    duelWinManager,
    duelCleanup,
  }: {
    inventoryRepository: InventoryRepository;
    discordService: DiscordService;
    duelRepository: DuelRepository;
    duelService: DuelService;
    playerRepository: PlayerRepository;
    duelWinManager: DuelWinManager;
    duelCleanup: DuelCleanup;
  }) {
    this.inventoryRepository = inventoryRepository;
    this.discordService = discordService;
    this.duelRepository = duelRepository;
    this.duelService = duelService;
    this.playerRepository = playerRepository;
    this.duelWinManager = duelWinManager;
    this.duelCleanup = duelCleanup;
  }

  async handleItem(interaction: ButtonInteraction<CacheType>) {
    // Discord shit
    const { action, itemId, playerId } = parseItemsButtonId(
      interaction.customId
    );

    if (action !== 'item') {
      console.error('Caught in the wrong action for item');
      return;
    }

    const channelId = interaction.channelId;
    const guild = interaction.guild;
    const duelThread = await this.discordService.findDuelThread(
      guild,
      channelId
    );

    if (!duelThread) {
      await interaction.reply({
        content: 'Duel channel not found or is not a text channel.',
        ephemeral: true,
      });
      return;
    }

    // non discord shit
    const duel = await this.duelRepository.getById(duelThread?.id);

    if (!duel) {
      await interaction.reply({
        content: 'Duel not found.',
        ephemeral: true,
      });
      return;
    }

    if (!duel?.getPlayersIds().includes(interaction.user.id)) {
      await interaction.reply({
        content: "This isn't your duel!",
        ephemeral: true,
      });
      return;
    }

    // make sure they haven't used in an item in a duel yet
    const { status: canUseItemStatus } = await this.duelService.canUseItem({
      duel,
      playerId,
    });

    if (canUseItemStatus === 'ALREADY_USED_ITEM') {
      await interaction.reply({
        content: 'You have already used an item this duel.',
        ephemeral: true,
      });
      return;
    }

    if (!duel?.getId()) {
      await interaction.reply({
        content: 'Duel not found.',
        ephemeral: true,
      });
      return;
    }

    const itemRes = await this.inventoryRepository.getItem(playerId, itemId);
    if (!itemRes) {
      await interaction.reply({
        content: 'You dont have this item!',
        ephemeral: true,
      });
      return;
    }
    const { id } = itemRes;

    const player = await this.playerRepository.getById(duel.getId(), playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    const itemRepository = new ItemRepository();

    const item = await itemRepository.getItemById(itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    // use the item
    const { status, playerDead, playerGoesAgain, ...res } =
      await this.duelService.useItem({
        duel,
        player,
        item,
      });
    const { damage, heal } = res;

    await this.inventoryRepository.useItem(playerId, itemId);

    await this.playerRepository.save(player, duel.getId());
    await this.duelRepository.save(duel);

    if (playerGoesAgain) {
      const message = `<@${player.getId()}> used ${item?.getName()}! They get to go again!`;
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });
      await interaction.reply({
        content: message,
        components: [row as any],
      });

      return;
    }

    if (playerDead) {
      // this shit needs to be abstracted it's too much
      const duelThread = await this.discordService.findDuelThread(
        interaction.guild,
        interaction?.channelId
      );
      // the game has ended the other player has won
      const winnerId = duel.getPlayersIds().find((p) => p !== player.getId());

      if (!winnerId) {
        throw new Error('Winner not found');
      }

      const otherPlayer = await this.playerRepository.getById(
        duel.getId(),
        winnerId
      );

      if (!otherPlayer) {
        throw new Error('Other player not found');
      }

      await interaction.reply(
        `<@${player.getId()}> took the potion but has died! Oh no! <@${winnerId}> wins!`
      );
      //  message user that they won 5 gold
      await interaction.followUp({
        content: `<@${winnerId}> has won 5 gold!`,
      });
      // lock the thread bc the game is over
      await duelThread?.setLocked(true);
      const wagerResults = await this.duelWinManager.handleWin(
        interaction.channelId,
        [player, otherPlayer]
      );
      if (wagerResults) {
        await interaction.followUp({ embeds: [wagerResults] });
      }
      if (!duelThread) throw new Error('duelThread is null');
      await this.duelCleanup.remove(duelThread.id, duel);
      return;
    }

    if (status === DUEL_NOT_FOUND) {
      await interaction.reply({
        content: 'Duel not found.',
        ephemeral: true,
      });
      return;
    }

    let prompt;

    if (damage) {
      prompt = `and got hurt for ${damage} damage!`;
    }

    if (heal) {
      prompt = `and healed for ${heal} health!`;
    }

    const fullMessage = `<@${player.getId()}> used ${item?.getName()} ${prompt}`;

    // show how much health they have left
    const playerHealth = player.getHealth();

    //prompt the other play to go
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: this.duelService.getCounter(),
      healId: this.duelService.getCounter(),
      leaveId: this.duelService.getCounter(),
    });

    // damage is the total damage and rolls are an array of each roll as a number
    const nextPlayerId = duel.getCurrentTurnPlayerId();
    const nextPlayerPrompt = `<@${nextPlayerId}> it's your turn!`;

    await interaction.reply({
      content: `${fullMessage} <@${player.getId()}> has ${playerHealth} health left.\n\n${nextPlayerPrompt}`,
      components: [row as any],
    });
  }
}
