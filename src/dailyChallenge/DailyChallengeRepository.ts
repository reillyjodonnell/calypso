import { DailyChallenge } from './DailyChallenge';
import { DailyChallengeDTO } from './DailyChallengeDTO';
import { dailyChallengeData } from './dailyChallengeMockDb';

export class DailyChallengeRepository {
  constructor() {}

  async getDailyChallenges(): Promise<DailyChallenge[]> {
    return new Promise((resolve, _) => {
      // loop and create DailyChallenge for each
      const dailyChallenges = dailyChallengeData.map((dailyChallenge) => {
        const dailyChallengeDTO = DailyChallengeDTO.fromDTO(dailyChallenge);
        return dailyChallengeDTO;
      });

      resolve(dailyChallenges);
    });
  }
}
