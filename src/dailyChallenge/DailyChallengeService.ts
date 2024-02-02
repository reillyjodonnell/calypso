import { Chance } from 'chance';
import { DailyChallengeRepository } from './DailyChallengeRepository';

export class DailyChallengeService {
  constructor(private dailyChallengeRepository: DailyChallengeRepository) {}

  async getTodaysDailyChallenge() {
    const dailyChallenges =
      await this.dailyChallengeRepository.getDailyChallenges();
    const random = Chance().integer({
      min: 0,
      max: dailyChallenges.length - 1,
    });
    return dailyChallenges[random];
  }
}
