export class DailyChallenge {
  id: number;
  challenge: string;
  payout: number;
  constructor(id: number, challenge: string, payout: number) {
    this.id = id;
    this.challenge = challenge;
    this.payout = payout;
  }
}
