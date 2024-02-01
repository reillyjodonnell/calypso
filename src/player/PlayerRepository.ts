import { RedisClientType } from '@redis/client';
import { Player } from './player';
import { PlayerDTO } from './PlayerDTO';

export class PlayerRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async save(player: Player, threadId: string) {
    const playerDTO = new PlayerDTO(player);
    const serializedDuel = JSON.stringify(playerDTO);
    await this.redisClient.set(`${threadId}:${player.getId()}`, serializedDuel);
  }

  async getById(duelId: string, playerId: string) {
    const serializedDuel = await this.redisClient.get(`${duelId}:${playerId}`);
    if (!serializedDuel) return null;
    const duelDTO = JSON.parse(serializedDuel);
    return PlayerDTO.fromDTO(duelDTO);
  }

  async deleteDuel(duelId: string) {
    await this.redisClient.del(`player:${duelId}`);
  }
}
