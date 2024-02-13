import { EventEmitter } from 'events';
import { DuelService } from '../duel/DuelService';
import { AIDecisionService } from './AIDecisionService';
import { PlayerRepository } from '../player/PlayerRepository';
import { DuelRepository } from '../duel/DuelRepository';
import { AIDuelService } from './AIDuelService';
import { DiscordService } from '../discord/DiscordService';

export class AIInteractionHandler {
  constructor(
    private event: EventEmitter,
    private playerRepository: PlayerRepository,
    private duelRepository: DuelRepository,
    private aiDuelService: AIDuelService,
    private discordService: DiscordService
  ) {
    this.initializeListeners();
  }

  private initializeListeners() {
    this.event.on('aiTurn', this.listenForAITurn);
  }

  async listenForAITurn(duelId: string, aiId: string) {
    const duel = await this.duelRepository.getById(duelId);
    const aiPlayer = await this.playerRepository.getById(duelId, aiId);
    if (!duel) throw new Error('Duel not found');
    if (!aiPlayer) throw new Error('AI not found');
    const opponentId = duel.getPlayers().find((id) => id !== aiId);
    if (!opponentId) throw new Error('Opponent id not found');
    const opponent = await this.playerRepository.getById(duelId, opponentId);
    if (!opponent) throw new Error('Opponent not found');

    const {} = this.aiDuelService.processAITurn(duel, aiPlayer, opponent);

    await this.duelRepository.save(duel);
    await this.playerRepository.save(aiPlayer, duelId);
    await this.playerRepository.save(opponent, duelId);

    // emit the messages via discord
    // const message = await this.discordService.generateMessage();
    // await this.discordService.emit(message);
  }
}
