import { LeaderboardRepository } from './LeaderboardRepository';

export class LeaderboardService {
  constructor(private leaderboardRepository: LeaderboardRepository) {}

  async getTop10() {
    const leaderboardData = await this.leaderboardRepository.getLeaderBoard();
    return leaderboardData;
  }

  async getTop3() {
    const leaderboardData = await this.leaderboardRepository.getTop3Players();
    return leaderboardData;
  }

  async resetLeaderboard() {
    await this.leaderboardRepository.resetLeaderboard();
  }

  async increment(userId: string, score: number) {
    await this.leaderboardRepository.increment(userId, score);
  }
}
