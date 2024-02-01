import {
  ActionRowBuilder,
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Collection,
  GuildMember,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { PlayerRepository } from './player/PlayerRepository';
import {
  ALL_PLAYERS_READY,
  ALL_PLAYERS_ROLLED,
  ALREADY_ACCEPTED_DUEL,
  ATTACK_HITS,
  CRITICAL_FAIL,
  CRITICAL_HIT,
  DUEL_ACCEPTED,
  DUEL_INVALID,
  DUEL_NOT_FOUND,
  DUEL_STARTED,
  DuelService,
  NOT_PLAYERS_TURN,
  PLAYER_ALREADY_ROLLED,
  PLAYER_NOT_CHALLENGED,
  PLAYER_NOT_FOUND,
  PLAYER_ROLLED,
} from './duel/DuelService';
import { DiscordService } from './discord/DiscordService';
import {
  createAcceptButton,
  createButtonId,
  createRejectButton,
  createRollButton,
  createWagerButton,
  getAllButtonOptions,
  parseButtonId,
} from './buttons';
import { DuelRepository } from './duel/DuelRepository';
import { PlayerService } from './player/PlayerService';
import { DuelWinManager } from './duel/DuelWinManager';
import {
  FALL_DOWN,
  NO_EFFECT,
  SELF_HARM,
} from './randomEvents/RandomEventsGenerator';

const DEFAULT_DIE = 'd20';
const DEFAULT_HEAL_DIE = 'd4';
const DEFAULT_DAMAGE_DIE = 'd6';

export class InteractionHandler {
  constructor(
    private duelRepository: DuelRepository,
    private playerRepository: PlayerRepository,
    private playerService: PlayerService,
    private duelService: DuelService,
    private discordService: DiscordService,
    private duelWinManager: DuelWinManager
  ) {}

  async handleDuel(interaction: ChatInputCommandInteraction<CacheType>) {
    const user = interaction.options.getUser('user', true);
    const challengerId = interaction.user.id;
    const duelThread = await this.discordService.createDuelThread({
      challengedId: user.id,
      challengerId,
      guild: interaction.guild,
    });

    const { status, players, duel } = await this.duelService.challengePlayer({
      challengedId: user.id,
      challengerId,
      duelId: duelThread.id,
    });

    try {
      if (!duel || !players) throw new Error('duel or players is null');
      // store them in the repositories
      await this.duelRepository.save(duel);
      for (const player of players) {
        await this.playerRepository.save(player, duelThread.id);
      }
    } catch (err) {
      console.error(err);
    }

    if (status === DUEL_STARTED) {
      const threadLink = `https://discord.com/channels/${interaction.guild?.id}/${duelThread.id}`;
      await interaction.reply(
        `Duel started! 👀 <@${challengerId}> challenged <@${user.id}> to a duel!\n\nGo to this link to check out their duel: ${threadLink}`
      );

      // create button
      const acceptButton = createAcceptButton(
        createButtonId({
          action: 'accept',
          guildId: interaction.guildId,
          threadId: duelThread.id,
          counter: this.duelService.getCounter(),
        }),
        false
      );

      const leaveButton = createRejectButton(
        createButtonId({
          action: 'accept',
          guildId: interaction.guildId,
          threadId: duelThread.id,
          counter: this.duelService.getCounter(),
        }),
        false
      );

      const row = new ActionRowBuilder().addComponents(
        acceptButton,
        leaveButton
      );

      await duelThread.send({
        content: `<@${challengerId}>, <@${user.id}>, your duel has been set up here. Please use this thread for all duel-related commands and interactions.\n\n<@${user.id}> please use /accept to accept the duel or use the buttons below.`,
        components: [row as any], // Send the button with the message
      });
    } else if (status === DUEL_INVALID) {
      await interaction.reply({
        content: 'You cannot duel yourself!',
        ephemeral: true,
      });
      return;
    }
  }

  async acceptDuel(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | ButtonInteraction<CacheType>
  ) {
    const discordService = new DiscordService();
    const userId = interaction.user.id;
    const channelId = interaction.channelId;
    const guild = interaction.guild;
    const duelThread = await discordService.findDuelThread(guild, channelId);

    if (!duelThread || channelId !== duelThread.id) {
      await interaction.reply({
        content: 'Please use your designated duel thread for this command',
        ephemeral: true,
      });
    }
    if (!duelThread) {
      await interaction.reply({
        content: 'Duel channel not found or is not a text channel.',
        ephemeral: true,
      });
      return;
    }

    const duel = await this.duelRepository.getById(duelThread.id);

    if (!duel) {
      interaction.reply({
        content: 'Duel not found. Please try again!',
        ephemeral: true,
      });
      return;
    }

    const {
      status,
      ids,
      duel: updatedDuel,
    } = await this.duelService.acceptDuel({
      challengedId: userId,
      duel,
    });

    if (updatedDuel) {
      try {
        await this.duelRepository.save(updatedDuel);
      } catch (err) {
        console.error(err);
      }
    }

    if (status === ALREADY_ACCEPTED_DUEL) {
      await interaction.reply({
        content: 'You have already accepted the duel',
        ephemeral: true,
      });
      return;
    }

    if (status === PLAYER_NOT_CHALLENGED) {
      await interaction.reply({
        content: 'You are not the challenged user, dick',
        ephemeral: true,
      });
      return;
    }

    if (status === DUEL_NOT_FOUND) {
      await interaction.reply(
        'Duel channel not found or is not a text channel.'
      );
      return;
    }
    if (status === PLAYER_NOT_FOUND) {
      await interaction.reply(
        'Quiet now, the match is about to begin! Wait your turn.'
      );
      return;
    }

    if (status === DUEL_ACCEPTED) {
      interaction.reply(`Duel accepted!`);
      return;
    }

    if (status === ALL_PLAYERS_READY) {
      const rollForInitativeButton = createRollButton(
        createButtonId({
          guildId: interaction.guildId,
          action: 'initiative',
          threadId: interaction.channelId,
          counter: this.duelService.getCounter(),
        })
      );

      const wagerButton = createWagerButton(
        createButtonId({
          guildId: interaction.guildId,
          action: 'wager',
          threadId: interaction.channelId,
          counter: this.duelService.getCounter(),
        })
      );

      const row = new ActionRowBuilder().addComponents(
        rollForInitativeButton,
        wagerButton
      );

      interaction.reply(`All players are now ready!`);
      const mentionPlayers = ids?.map((id: string) => `<@${id}>`).join(' ');
      try {
        await duelThread?.send({
          content: `${mentionPlayers}, roll for initiative using /initiative d20`,
          components: [row as any], // Send the button with the message
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  async handleRollForInitiative(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | ButtonInteraction<CacheType>
  ) {
    const discordService = new DiscordService();
    const duelThread = await discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    if (!duelThread || interaction.channelId !== duelThread.id) {
      await interaction.reply(
        'Please use your designated duel thread for this command.'
      );
      return;
    }

    const dice = 'd20';

    if (!dice) throw new Error('dice is null');

    const duel = await this.duelRepository.getById(duelThread.id);

    const { result, status, playerToGoFirst } =
      await this.duelService.rollForInitiative({
        duel,
        playerId: interaction.user.id,
        sidedDie: dice,
      });

    if (status === PLAYER_ALREADY_ROLLED) {
      await interaction.reply({
        content: "You've already rolled for initiative",
        ephemeral: true,
      });
      return;
    }

    if (status === DUEL_NOT_FOUND) {
      await interaction.reply(
        'Duel channel not found or is not a text channel.'
      );
      return;
    }

    if (status === PLAYER_ROLLED) {
      await interaction.reply(
        `${interaction.user.displayName} rolled a ${result} for initiative!\nWaiting for other players to roll for initiative.`
      );
      return;
    }

    if (status === ALL_PLAYERS_ROLLED) {
      if (!playerToGoFirst) throw new Error('playerToGoFirst is null');

      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: playerToGoFirst,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });
      await interaction.reply({
        content: `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn!`,
        components: [row as any], // Send the button with the message
      });
    }
  }

  async promptForTargetForHealOrAttack(
    interaction: ButtonInteraction<CacheType>
  ) {
    if (!interaction.guildId) throw new Error('interaction.guildId is null');
    if (!interaction.channelId)
      throw new Error('interaction.channelId is null');
    if (!interaction.user.id) throw new Error('interaction.user.id is null');

    const { action } = parseButtonId(interaction.customId);

    const discordService = new DiscordService();

    const duelThread = await discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    if (!duelThread || interaction.channelId !== duelThread.id) {
      await interaction.reply(
        'Please use your designated duel thread for this command.'
      );
      return;
    }

    const duel = await this.duelRepository.getById(duelThread.id);
    if (!duel) {
      await interaction.reply({ content: 'Duel not found', ephemeral: true });
      return;
    }
    const duelParticipants = duel.getPlayers();

    // Filter members to include only duel participants
    const members: Collection<string, GuildMember> | undefined =
      interaction?.guild?.members.cache.filter(
        (member: any) =>
          !member.user.bot && duelParticipants.includes(member.user.id)
      );

    if (members?.size === 0) {
      // Handle the case where there are no duel participants
      await interaction.reply({
        content: 'No participants found in the duel.',
        ephemeral: true,
      });
      return;
    }
    const player = await this.playerRepository.getById(interaction.user.id);

    if (player?.getId() !== duel.getCurrentTurnPlayerId()) {
      await interaction.reply({
        content: "It's not your turn!",
        ephemeral: true,
      });
      return;
    }

    const targets = duel.getPlayersIds();

    // Create options for the select menu
    const options = targets?.map((id) => {
      const targetMember = interaction?.guild?.members.cache.get(id); // Retrieve the member object from the cache

      if (!targetMember) {
        console.error(`Member with ID ${id} not found.`);
        return null; // Or handle this case as you see fit
      }

      const displayName = targetMember.displayName; // Get the display name
      if (!displayName) throw new Error('displayName is null');
      return new StringSelectMenuOptionBuilder()
        .setLabel(displayName)
        .setValue(id);
    });

    if (!options) throw new Error('options is null');

    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(
            createButtonId({
              action,
              guildId: interaction.guildId,
              threadId: interaction.channelId,
              counter: this.duelService.getCounter(),
            })
          )
          .setPlaceholder('Select a target')
          .addOptions(...(options as StringSelectMenuOptionBuilder[]))
      );

    // Send the reply
    try {
      await interaction.reply({
        content: 'Choose your target:',
        components: [selectMenu],
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async handleHeal(interaction: StringSelectMenuInteraction<CacheType>) {
    const defaultHealDie = 'd4';
    const discordService = new DiscordService();
    const duelThread = await discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    if (!duelThread || interaction.channelId !== duelThread.id) {
      await interaction.reply(
        'Please use your designated duel thread for this command.'
      );
      return;
    }

    const duel = await this.duelRepository.getById(duelThread.id);
    const target = interaction.values[0];

    // whoever they selected. Hope they didn't fuck up lmao
    const playerTarget = await this.playerRepository.getById(target);

    const {
      status,
      healthRemaining,
      roll,
      nextPlayerId,
      duel: updatedDuel,
      player,
    } = this.duelService.healingRoll({
      duel,
      player: playerTarget,
      sidedDie: defaultHealDie,
    });
    if (status === 'NOT_PLAYERS_TURN') {
      await interaction.reply({
        content: "It's not your turn!",
        ephemeral: true,
      });
      return;
    }
    if (status === 'NO_MORE_POTIONS') {
      await interaction.reply(
        'You have no more potions left! Choose a different action.'
      );
      return;
    }

    if (!updatedDuel || !player) {
      await interaction.reply({
        content: `Uh oh something happened. Try again!`,
        ephemeral: true,
      });
      return;
    }

    try {
      await this.duelRepository.save(updatedDuel);
      await this.playerRepository.save(player, duelThread.id);
    } catch (err) {
      console.error(err);
    }

    if (status === 'PLAYER_HEALED') {
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });

      await interaction.reply({
        content: `You rolled a ${roll} and healed ${roll} health! You have ${healthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
        components: [row as any],
      });
    }
  }

  async handleAttackTargetSelected(
    interaction: StringSelectMenuInteraction<CacheType>
  ) {
    const targetId = interaction.values[0];
    const discordService = new DiscordService();
    const duelThread = await discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    if (!duelThread || interaction.channelId !== duelThread.id) {
      await interaction.reply(
        'Please use your designated duel thread for this command.'
      );
      return;
    }
    const duel = await this.duelRepository.getById(duelThread.id);
    const attacker = await this.playerRepository.getById(interaction.user.id);
    const defender = await this.playerRepository.getById(targetId);

    if (!attacker || !defender || !duel) {
      await interaction.reply({
        content: 'Something went wrong! Try again!',
        ephemeral: true,
      });
      return;
    }
    const { roll, status, nextPlayerId } = await this.duelService.attemptToHit({
      duel,
      attacker,
      defender,
      sidedDie: DEFAULT_DIE,
    });

    try {
      await this.playerRepository.save(attacker, duelThread.id);
      await this.playerRepository.save(defender, duelThread.id);
      await this.duelRepository.save(duel);
    } catch (err) {
      console.error(err);
    }

    if (status === 'NOT_ATTACKERS_TURN') {
      await interaction.reply("It's not your turn!");
      return;
    }

    if (status === CRITICAL_HIT) {
      const rollButton = createRollButton(
        createButtonId({
          action: 'roll_for_damage_2x',
          guildId: interaction.guildId,
          threadId: interaction.channelId,
          counter: this.duelService.getCounter(),
        }),
        false
      );
      const row = new ActionRowBuilder().addComponents(rollButton);
      await interaction.reply({
        content: `You rolled a ${roll}. Critical hit! Damage is doubled. Roll for damage using /roll_for_damage 2d6`,
        components: [row as any],
      });

      return;
    }

    if (status === CRITICAL_FAIL) {
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });

      // generate the random event
      const { status, damage, isPlayerDead, healthRemaining } =
        this.duelService.criticalFailAttack(attacker);

      // be sure to save it
      try {
        await this.playerRepository.save(attacker, duelThread.id);
      } catch (err) {
        console.error(err);
      }

      if (isPlayerDead) {
        const description = `You swing at your target, but miss and hit yourself for ${damage} damage! You have died!`;
        this.duelWinManager.handleWin(interaction.channelId, [
          attacker,
          defender,
        ]);
        // end game
        await interaction.reply({
          content: `${description}\n\n<@${nextPlayerId}> wins!`,
          components: [row as any],
        });
        await duelThread.setLocked(true);
        if (!nextPlayerId) throw new Error('nextPlayer id is null');
        this.duelWinManager.handleWin(interaction.channelId, [
          attacker,
          defender,
        ]);
      }

      switch (status) {
        case SELF_HARM:
          await interaction.reply({
            content: `You swing at your target, but miss and hit yourself for ${damage} damage! You have ${healthRemaining} health remaining.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack`,
            components: [row as any],
          });
          break;
        case NO_EFFECT:
          await interaction.reply({
            content: `You swing at your target and miss terribly. Somehow you recovered!\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack`,
            components: [row as any],
          });
          break;
        case FALL_DOWN:
          await interaction.reply({
            content: `You swing at your target and miss terribly. You fall down and lose your turn!\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack`,
            components: [row as any],
          });
          break;
      }

      return;
    }

    if (status === ATTACK_HITS) {
      const rollButton = createRollButton(
        createButtonId({
          action: 'roll_for_damage',
          guildId: interaction.guildId,
          threadId: interaction.channelId,
          counter: this.duelService.getCounter(),
        }),
        false
      );
      const row = new ActionRowBuilder().addComponents(rollButton);
      await interaction.reply({
        content: `You rolled a ${roll} and hit! Roll for damage using /roll_for_damage d6`,
        components: [row as any],
      });
      return;
    }
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: this.duelService.getCounter(),
      healId: this.duelService.getCounter(),
      leaveId: this.duelService.getCounter(),
    });

    await interaction.reply({
      content: `You rolled a ${roll} and missed! :(\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack`,
      components: [row as any],
    });
  }

  async handleRollForDamage(
    interaction: ButtonInteraction<CacheType>,
    criticalHit = false
  ) {
    const duelThread = await this.discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    if (!duelThread || interaction.channelId !== duelThread.id) {
      await interaction.reply(
        'Please use your designated duel thread for this command.'
      );
      return;
    }
    const duel = await this.duelRepository.getById(duelThread.id);

    // make sure the interaction user id is in the duel player ids
    const isInDuel = duel?.getPlayersIds().includes(interaction.user.id);

    if (!isInDuel) {
      await interaction.reply({
        content: 'You are not in the duel!',
        ephemeral: true,
      });
      return;
    }

    const attacker = await this.playerRepository.getById(interaction.user.id);
    if (!attacker) {
      interaction.reply({
        content: 'Uh oh. We had troubles. Try again!',
        ephemeral: true,
      });
      return;
    }

    const res = this.duelService.getAttackerTargetId(attacker);
    if (res.status === PLAYER_NOT_FOUND || !res.targetId) {
      await interaction.reply({
        content: 'You need to select a target first!',
        ephemeral: true,
      });
      return;
    }

    const defender = await this.playerRepository.getById(res.targetId);
    if (!defender) {
      await interaction.reply({
        content: 'Something went wrong! Try again!',
        ephemeral: true,
      });
      return;
    }

    if (!duel) {
      await interaction.reply({
        content: 'Duel not found! Try again.',
        ephemeral: true,
      });
      return;
    }

    const { status, roll, targetHealthRemaining, nextPlayerId } =
      await this.duelService.rollFordamage({
        duel,
        attacker,
        defender,
        sidedDie: DEFAULT_DAMAGE_DIE,
        criticalHit,
      });

    this.duelRepository.save(duel);
    this.playerRepository.save(attacker, duelThread.id);
    this.playerRepository.save(defender, duelThread.id);

    const { winnerId } = await this.duelService.determineWinner([
      attacker,
      defender,
    ]);

    if (status === 'NOT_ATTACKERS_TURN') {
      await interaction.reply("It's not your turn!");
      return;
    }
    if (status === 'TARGET_HIT') {
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });
      await interaction.reply({
        content: `You rolled a ${roll} and dealt ${roll} damage! <@${defender.getId()}> has ${targetHealthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
        components: [row as any],
      });
    }
    if (status === 'TARGET_DEAD' && !winnerId) {
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });
      await interaction.reply({
        content: `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${defender.getId()}>!\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
        components: [row as any],
      });
      return;
    }
    if (status === 'TARGET_DEAD' && winnerId) {
      await interaction.reply(
        `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${defender.getId()}>! <@${winnerId}> wins!`
      );
      // lock the thread bc the game is over
      await duelThread.setLocked(true);
      this.duelWinManager.handleWin(interaction.channelId, [
        attacker,
        defender,
      ]);
      return;
    }
  }
}
