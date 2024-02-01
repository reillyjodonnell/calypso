import { RedisClientType } from 'redis';
import { Wager } from './WagerManager';

export interface WagerRepositoryInterface {
  placeWager(threadId: string, wager: Wager): Promise<void>;
  getWagers(threadId: string): Promise<Wager[]>;
  // Additional methods as needed
}

export class WagerRepository implements WagerRepositoryInterface {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async placeWager(threadId: string, wager: Wager): Promise<void> {
    // Serialize the wager object
    const wagerSerialized = JSON.stringify(wager);
    // Use RPUSH to add the wager to the end of the list
    await this.redisClient.rPush(`wagers:${threadId}`, wagerSerialized);
  }

  async getWagers(threadId: string): Promise<Wager[]> {
    // Retrieve the list of wagers
    const wagersSerialized = await this.redisClient.lRange(
      `wagers:${threadId}`,
      0,
      -1
    );
    return wagersSerialized.map((wagerStr) => JSON.parse(wagerStr));
  }

  async clearWager(threadId: string) {
    await this.redisClient.del(`wagers:${threadId}`);
  }

  // Additional methods as needed
}
