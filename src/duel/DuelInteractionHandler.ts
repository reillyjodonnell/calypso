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
import { PlayerRepository } from '../player/PlayerRepository';
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
  PLAYER_ALREADY_ROLLED,
  PLAYER_NOT_CHALLENGED,
  PLAYER_NOT_FOUND,
  PLAYER_ROLLED,
} from './DuelService';
import { DiscordService } from '../discord/DiscordService';
import {
  createAcceptButton,
  createButtonId,
  createRejectButton,
  createRollButton,
  createWagerButton,
  getAllButtonOptions,
  parseButtonId,
} from '../buttons';
import { DuelRepository } from './DuelRepository';
import { DuelWinManager } from './DuelWinManager';
import {
  FALL_DOWN,
  NO_EFFECT,
  SELF_HARM,
} from '../randomEvents/RandomEventsGenerator';
import { DuelCleanup } from './DuelCleanup';
import { InventoryRepository } from '../inventory/InventoryRepository';
import { WeaponRepository } from '../weapon/WeaponRepository';
import { openaiType } from '../..';
import { requestAIResponse } from '../ai/aiHelper';

export class DuelInteractionHandler {
  constructor(
    private duelRepository: DuelRepository,
    private playerRepository: PlayerRepository,
    private duelService: DuelService,
    private discordService: DiscordService,
    private duelWinManager: DuelWinManager,
    private duelCleanup: DuelCleanup,
    private inventoryRepository: InventoryRepository,
    private weaponRepository: WeaponRepository,
    private openai: openaiType
  ) {}

  async handleDuel(interaction: ChatInputCommandInteraction<CacheType>) {
    const user = interaction.options.getUser('user', true);
    const challengerId = interaction.user.id;
    const duelThread = await this.discordService.createDuelThread({
      challengedId: user.id,
      challengerId,
      guild: interaction.guild,
    });

    // for both we need to get their weapons, find which is equipped, then pass it
    const challengerWeaponRes = await this.inventoryRepository.getActiveWeapon(
      challengerId
    );
    const challengedWeaponRes = await this.inventoryRepository.getActiveWeapon(
      user.id
    );

    if (!challengerWeaponRes || !challengedWeaponRes) {
      await interaction.reply({
        content: 'You or your opponent do not have a weapon equipped!',
        ephemeral: true,
      });
      return;
    }

    const challengerWeapon = await this.weaponRepository.getWeapon(
      challengedWeaponRes.id
    );
    const challengedWeapon = await this.weaponRepository.getWeapon(
      challengedWeaponRes.id
    );

    if (!challengerWeapon || !challengedWeapon) {
      await interaction.reply({
        content: 'Trouble fetching weapons! Try again.',
        ephemeral: true,
      });
      return;
    }

    const { status, players, duel } = this.duelService.challengePlayer({
      challengedId: user.id,
      challengerId,
      duelId: duelThread.id,
      challengerWeapon,
      challengedWeapon,
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
        content: `<@${challengerId}>, <@${user.id}>, your duel has been set up here. Please use this thread for all duel-related commands and interactions.\n\n<@${user.id}> accept the duel to begin.`,
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
      await interaction.reply({
        content: 'Duel not found. Please try again!',
        ephemeral: true,
      });
      return;
    }

    const {
      status,
      ids,
      duel: updatedDuel,
    } = this.duelService.acceptDuel({
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
        content: 'You have already accepted the duel!',
        ephemeral: true,
      });
      return;
    }

    if (status === PLAYER_NOT_CHALLENGED) {
      await interaction.reply({
        content: 'You are not the challenged user.',
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
      await interaction.reply(`Duel accepted!`);
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

      await interaction.reply(
        `All players are now ready!\n\nWagering is open until a player rolls for initiative! Good luck!`
      );
      const mentionPlayers = ids?.map((id: string) => `<@${id}>`).join(' ');
      try {
        await duelThread?.send({
          content: `${mentionPlayers}, roll for initiative below!`,
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

    const dice = '1d20';

    if (!dice) throw new Error('dice is null');

    const duel = await this.duelRepository.getById(duelThread.id);

    if (!duel) {
      await interaction.reply({
        content: 'Duel not found. Please try again',
        ephemeral: true,
      });
      return;
    }

    const { result, status, playerToGoFirst } =
      this.duelService.rollForInitiative({
        duel,
        playerId: interaction.user.id,
        sidedDie: dice,
      });

    await this.duelRepository.save(duel);

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
      const res = `${interaction.user.displayName} rolled a ${result} for initiative!\nWaiting for other players to roll for initiative.`;
      await interaction.deferReply();
      const message = await requestAIResponse(this.openai, interaction, res);

      await interaction.followUp({
        content: message,
      });
      return;
      await interaction.reply(
        `${interaction.user.displayName} rolled a ${result} for initiative!\nWaiting for other players to roll for initiative.`
      );
      return;
    }

    if (status === ALL_PLAYERS_ROLLED) {
      if (!playerToGoFirst) throw new Error('playerToGoFirst is null');
      const res = `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn!`;
      await interaction.deferReply();
      const message = await requestAIResponse(this.openai, interaction, res);
      const row = getAllButtonOptions({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: playerToGoFirst,
        attackId: this.duelService.getCounter(),
        healId: this.duelService.getCounter(),
        leaveId: this.duelService.getCounter(),
      });
      await interaction.followUp({
        content: message,
        components: [row as any], // Send the button with the message
      });
      return;

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
    const player = await this.playerRepository.getById(
      duelThread.id,
      interaction.user.id
    );

    if (!player) {
      await interaction.reply({
        content: 'You are not a participant in the duel.',
        ephemeral: true,
      });
      return;
    }

    if (player?.getId() !== duel.getCurrentTurnPlayerId()) {
      await interaction.reply({
        content: "It's not your turn!",
        ephemeral: true,
      });
      return;
    }

    const targets = duel.getPlayersIds();

    const options = await Promise.all(
      targets.map(async (id) => {
        let targetMember = interaction?.guild?.members.cache.get(id);
        if (!targetMember) {
          try {
            targetMember = await interaction?.guild?.members.fetch(id);
          } catch (error) {
            console.error(`Error fetching member with ID ${id}: ${error}`);
            return null;
          }
        }

        if (!targetMember) {
          console.error(`Member with ID ${id} not found.`);
          return null;
        }

        const displayName = targetMember.displayName;
        if (!displayName) throw new Error('displayName is null');

        return new StringSelectMenuOptionBuilder()
          .setLabel(displayName)
          .setValue(id);
      })
    );

    // Filter out any null options
    const validOptions = options.filter((option) => option !== null);

    if (!validOptions) throw new Error('No valid options generated');

    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(
            createButtonId({
              action,
              guildId: interaction.guildId,
              threadId: duelThread.id,
              counter: this.duelService.getCounter(),
            })
          )
          .setPlaceholder('Select a target')
          .addOptions(validOptions as StringSelectMenuOptionBuilder[])
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
    const defaultHealDie = '1d4';
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

    if (!interaction.guildId) throw new Error('interaction.guildId is null');

    const duel = await this.duelRepository.getById(duelThread.id);
    const target = interaction.values[0];

    // whoever they selected. Hope they didn't fuck up lmao
    const playerTarget = await this.playerRepository.getById(
      duelThread.id,
      target
    );

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
      await interaction.deferReply();
      const res = `You rolled a ${roll} and healed ${roll} health! You have ${healthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Attack or heal yourself!`;
      const message = await requestAIResponse(this.openai, interaction, res);
      await interaction.followUp({
        content: message,
        components: [row as any],
      });
      return;
      await interaction.reply({
        content: `You rolled a ${roll} and healed ${roll} health! You have ${healthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Attack or heal yourself!`,
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

    if (!interaction.guildId) throw new Error('interaction.guildId is null');

    const duel = await this.duelRepository.getById(duelThread.id);
    const attacker = await this.playerRepository.getById(
      duelThread.id,
      interaction.user.id
    );
    const defender = await this.playerRepository.getById(
      duelThread.id,
      targetId
    );

    if (!attacker || !defender || !duel) {
      await interaction.reply({
        content: 'Something went wrong! Try again!',
        ephemeral: true,
      });
      return;
    }

    const { roll, status, nextPlayerId } = this.duelService.attemptToHit({
      duel,
      attacker,
      defender,
      sidedDie: attacker.getRollToHit(),
    });

    try {
      // defender doesn't get changed during attempt to hit so we just save the attacker
      await this.playerRepository.save(attacker, duelThread.id);
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
      await interaction.deferReply();
      const res = `You rolled a ${roll}. Critical hit! Damage is doubled. Roll for damage below!`;
      const message = await requestAIResponse(this.openai, interaction, res);
      await interaction.followUp({
        content: message,
        components: [row as any],
      });
      return;
      await interaction.reply({
        content: `You rolled a ${roll}. Critical hit! Damage is doubled. Roll for damage below!`,
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
        const wagerResults = await this.duelWinManager.handleWin(
          interaction.channelId,
          [attacker, defender]
        );
        // end game
        await interaction.reply({
          content: `${description}\n\n<@${nextPlayerId}> wins!`,
          components: [row as any],
        });

        await interaction.followUp({
          content: `<@${nextPlayerId}> has won 5 gold!`,
        });

        if (wagerResults) {
          await interaction.followUp({ embeds: [wagerResults] });
        }
        await duelThread.setLocked(true);
        await this.duelCleanup.remove(duelThread.id, duel);
        if (!nextPlayerId) throw new Error('nextPlayer id is null');
      }

      let statement = '';
      switch (status) {
        case SELF_HARM:
          statement = `You swing at your target, but miss and hit yourself for ${damage} damage! You have ${healthRemaining} health remaining.\n\n<@${nextPlayerId}> it's your turn! Attack or heal yourself!`;

          break;
        case NO_EFFECT:
          statement = `You swing at your target and miss terribly. Somehow you recovered!\n\n<@${nextPlayerId}> it's your turn!`;

          break;
        case FALL_DOWN:
          statement = `You swing at your target and miss terribly. You fall down and lose your turn!\n\n<@${nextPlayerId}> it's your turn!`;

          break;
      }
      await interaction.deferReply();
      const message = await requestAIResponse(
        this.openai,
        interaction,
        statement
      );
      await interaction.followUp({
        content: message,
        components: [row as any],
      });
      return;
      await interaction.reply({
        content: statement,
        components: [row as any],
      });

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
      const res = `you rolled a ${roll} and hit! Roll for damage below!`;
      await interaction.deferReply();
      const message = await requestAIResponse(this.openai, interaction, res);

      await interaction.followUp({
        content: message,
        components: [row as any],
      });
      return;
    }
    await interaction.deferReply();

    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: this.duelService.getCounter(),
      healId: this.duelService.getCounter(),
      leaveId: this.duelService.getCounter(),
    });
    const missedMessage = `You rolled a ${roll} and missed! :(\n\n<@${nextPlayerId}> it's your turn!`;
    const message = await requestAIResponse(
      this.openai,
      interaction,
      missedMessage
    );

    await interaction.followUp({
      content: message,
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
    if (!interaction.guildId) throw new Error('interaction.guildId is null');

    const attacker = await this.playerRepository.getById(
      duelThread.id,
      interaction.user.id
    );
    if (!attacker) {
      await interaction.reply({
        content: 'Uh oh. We had troubles. Try again!',
        ephemeral: true,
      });
      return;
    }

    const res = this.duelService.getAttackerTargetId(attacker);

    if (res.status === PLAYER_NOT_FOUND || !res.targetId) {
      console.log('status: ', res.status);
      console.log('targetId: ', res.targetId);
      await interaction.reply({
        content: 'You need to select a target first!',
        ephemeral: true,
      });
      return;
    }

    const defender = await this.playerRepository.getById(
      duelThread.id,
      res.targetId
    );
    if (!defender) {
      console.error('DEFENDER IS NULL');
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

    const {
      status,
      roll,
      criticalHitRoll,
      targetHealthRemaining,
      nextPlayerId,
    } = this.duelService.rollFordamage({
      duel,
      attacker,
      defender,
      sidedDie: attacker.getDamage(),
      criticalHit,
    });

    this.duelRepository.save(duel);
    this.playerRepository.save(attacker, duelThread.id);
    this.playerRepository.save(defender, duelThread.id);

    const { winnerId } = this.duelService.determineWinner([attacker, defender]);

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
        content: `You rolled a ${roll} ${
          criticalHit ? `and a ${criticalHitRoll} ` : ''
        } and dealt ${
          roll! + (criticalHit ? criticalHitRoll! : 0)
        } damage! <@${defender.getId()}> has ${targetHealthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn!`,
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
        content: `You rolled a ${roll} ${
          criticalHit ? `and a ${criticalHitRoll} ` : ''
        } and dealt ${
          roll! + (criticalHit ? criticalHitRoll! : 0)
        } damage! You see the light leave their eyes. You killed <@${defender.getId()}>!\n\n<@${nextPlayerId}> it's your turn!`,
        components: [row as any],
      });
      return;
    }
    if (status === 'TARGET_DEAD' && winnerId) {
      await interaction.reply(
        `You rolled a ${roll} ${
          criticalHit ? `and a ${criticalHitRoll} ` : ''
        } and dealt ${
          roll! + (criticalHit ? criticalHitRoll! : 0)
        } damage! You see the light leave their eyes. You killed <@${defender.getId()}>! <@${winnerId}> wins!`
      );
      //  message user that they won 5 gold
      await interaction.followUp({
        content: `<@${winnerId}> has won 5 gold!`,
      });
      // lock the thread bc the game is over
      await duelThread.setLocked(true);
      const wagerResults = await this.duelWinManager.handleWin(
        interaction.channelId,
        [attacker, defender]
      );
      if (wagerResults) {
        await interaction.followUp({ embeds: [wagerResults] });
      }
      await this.duelCleanup.remove(duelThread.id, duel);
      // create a
      return;
    }
  }

  async handleWager(interaction: ButtonInteraction<CacheType>) {
    const discordService = new DiscordService();
    const duelThread = await discordService.findDuelThread(
      interaction.guild,
      interaction.channelId
    );
    if (!duelThread) {
      await interaction.reply({
        content: 'Duel not found. Please try again!',
        ephemeral: true,
      });
      return;
    }

    const duel = await this.duelRepository.getById(duelThread.id);

    if (!duel) {
      await interaction.reply({
        content: 'Duel not found. Please try again!',
        ephemeral: true,
      });
      return;
    }

    const playerIds = duel.getPlayersIds();

    const canAcceptWagers = duel.getIsBettingOpen();
    if (!canAcceptWagers) {
      await interaction.reply({
        content: 'Wagers are no longer being accepted',
        ephemeral: true,
      });
      return;
    }
    const { action, guildId, threadId } = parseButtonId(interaction.customId);

    const options = await Promise.all(
      playerIds.map(async (id) => {
        let targetMember = interaction?.guild?.members.cache.get(id);
        if (!targetMember) {
          try {
            targetMember = await interaction?.guild?.members.fetch(id);
          } catch (error) {
            console.error(`Error fetching member with ID ${id}: ${error}`);
            return null;
          }
        }

        if (!targetMember) {
          console.error(`Member with ID ${id} not found.`);
          return null;
        }

        const displayName = targetMember.displayName;
        if (!displayName) throw new Error('displayName is null');

        return new StringSelectMenuOptionBuilder()
          .setLabel(displayName)
          .setValue(id);
      })
    );

    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(
            createButtonId({
              action,
              guildId: interaction.guildId,
              threadId: interaction.channelId,
              counter: 0,
            })
          )
          .setPlaceholder('Select a duelist')
          .addOptions(options as StringSelectMenuOptionBuilder[])
      );
    // Send the reply
    await interaction.reply({
      content: 'Who do you bet on?',
      components: [selectMenu],
      ephemeral: true,
    });
    if (interaction.guildId !== guildId || interaction.channelId !== threadId) {
      await interaction.reply({
        content: 'Wrong thread',
        ephemeral: true,
      });
    }
  }
}
