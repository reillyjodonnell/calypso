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
    const serializedPlayer = JSON.stringify(playerDTO);
    await this.redisClient.set(
      `${threadId}:${player.getId()}`,
      serializedPlayer
    );
  }

  async getById(duelId: string, playerId: string) {
    const serializedPlayer = await this.redisClient.get(
      `${duelId}:${playerId}`
    );
    if (!serializedPlayer) return null;
    const duelDTO = JSON.parse(serializedPlayer);
    return PlayerDTO.fromDTO(duelDTO);
  }

  async delete(duelId: string, playerId: string) {
    await this.redisClient.del(`${duelId}:${playerId}`);
  }
}
