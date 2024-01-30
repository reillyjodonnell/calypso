// create a wager manager class and use the wager repository

import { RedisClientType } from 'redis';
import { WagerRepositoryInterface } from './WagerRepository';

export interface WagerManagerInterface {
  placeWager(threadId: string, wager: Wager): Promise<void>;
  getWagers(threadId: string): Promise<Wager[]>;
  // Additional methods as needed
}

export type Wager = {
  playerId: string;
  amount: number;
  betOnPlayerId: string; // The identifier of the entity the player is betting on
};

export class WagerManager implements WagerManagerInterface {
  private wagerRepository: WagerRepositoryInterface;

  constructor(wagerRepository: WagerRepositoryInterface) {
    this.wagerRepository = wagerRepository;
  }

  async placeWager(threadId: string, wager: Wager): Promise<void> {
    await this.wagerRepository.placeWager(threadId, wager);
  }

  async getWagers(threadId: string): Promise<Wager[]> {
    return await this.wagerRepository.getWagers(threadId);
  }
}
