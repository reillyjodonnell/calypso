import { RedisClientType } from '@redis/client';
import { Duel } from './Duel';
import { DuelDTO } from './DuelDTO';

export class DuelRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async save(duel: Duel) {
    const duelDTO = new DuelDTO(duel);
    const serializedDuel = JSON.stringify(duelDTO);
    await this.redisClient.set(`duel:${duel.getId()}`, serializedDuel);
  }

  async getById(duelId: string) {
    const serializedDuel = await this.redisClient.get(`duel:${duelId}`);
    if (!serializedDuel) return null;
    const duelDTO = JSON.parse(serializedDuel);
    return DuelDTO.fromDTO(duelDTO);
  }

  async deleteDuel(duelId: string) {
    await this.redisClient.del(`duel:${duelId}`);
  }
}
