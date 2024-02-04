import { RedisClientType } from '@redis/client';

export class LeaderboardRepository {
  constructor(private redisClient: RedisClientType) {}
  async getLeaderBoard() {
    return await this.redisClient.zRangeWithScores('leaderboard', 0, 9, {
      REV: true,
    });
  }

  async getTop3Players() {
    return await this.redisClient.zRangeWithScores('leaderboard', 0, 2, {
      REV: true,
    });
  }

  // it adds the user automatically if it doesn't exist
  async increment(userId: string, score: number) {
    return await this.redisClient.zIncrBy('leaderboard', score, userId);
  }

  async resetLeaderboard() {
    return await this.redisClient.del('leaderboard');
  }
}
