export class DailyChallengeDTO {
  id: number;
  challenge: string;
  payout: number;
  constructor(id: number, challenge: string, payout: number) {
    this.id = id;
    this.challenge = challenge;
    this.payout = payout;
  }

  static fromDTO(dto: DailyChallengeDTO): DailyChallengeDTO {
    return new DailyChallengeDTO(dto.id, dto.challenge, dto.payout);
  }
}
