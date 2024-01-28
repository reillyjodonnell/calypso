const MAX_HEALTH = 14;
export class Player {
  private health = MAX_HEALTH;
  private ac = 11;
  private numberOfHeals = 2;
  private healsUsed = 0;
  private targetId: string | null = null;

  constructor(private readonly id: string) {}

  public getId() {
    return this.id;
  }
  public getHealth() {
    return this.health;
  }
  // New method to set the target
  public setTarget(targetId: string) {
    this.targetId = targetId;
  }

  // New method to clear the target
  public clearTarget() {
    this.targetId = null;
  }

  // New method to get the current target
  public getTarget() {
    return this.targetId;
  }
  public hurt(damage: number) {
    // make sure it doesn't go below 0
    if (this.health - damage < 0) {
      this.health = 0;
      return;
    }
    this.health -= damage;
  }
  public heal(heal: number) {
    // make sure we have heals left
    if (this.healsUsed >= this.numberOfHeals) {
      return false;
    }
    // make sure it doesn't exceed max health
    this.health = Math.min(this.health + heal, MAX_HEALTH);
    this.healsUsed++;
    return true; // Heal was successful
  }
  public getAC() {
    return this.ac;
  }
  public setAC(ac: number) {
    this.ac = ac;
  }

  public isPlayerDead() {
    return this.health <= 0;
  }

  public hasHealsLeft() {
    return this.healsUsed < this.numberOfHeals;
  }
}

// we should be able to interact between player instances

export class PlayerManager {
  private players: Player[] = [];

  public addPlayer(playerid: string) {
    const player = new Player(playerid);
    this.players.push(player);
    return player;
  }

  public getPlayer(id: string) {
    return this.players.find((player) => player.getId() === id);
  }

  public getPlayers() {
    return this.players;
  }

  public removePlayer(id: string) {
    this.players = this.players.filter((player) => player.getId() !== id);
  }

  public doesAttackHitPlayer(defender: Player, roll: number) {
    return roll >= defender.getAC();
  }
  public attackTarget(attacker: Player, damage: number) {
    // get the target
    const targetId = attacker.getTarget();
    if (!targetId) {
      throw new Error("Attacker doesn't have a target");
    }
    // find the target
    const target = this.getPlayer(targetId);
    if (!target) {
      throw new Error("Target doesn't exist");
    }
    // attack the target
    const targetHealthRemaining = this.attackPlayer(target, damage);
    const isTargetDead = this.isPlayerDead(target);

    return { targetHealthRemaining, isTargetDead, targetId };
  }
  //attack a player with damage
  public attackPlayer(defender: Player, attack: number) {
    defender.hurt(attack);
    return defender.getHealth();
  }

  public healPlayer(player: Player, heal: number) {
    const healSuccess = player.heal(heal);
    return { healthRemaining: player.getHealth(), healSuccess };
  }

  public isPlayerDead(player: Player) {
    return player.isPlayerDead();
  }
  public setPlayerTarget(attackerId: string, targetId: string) {
    const attacker = this.getPlayer(attackerId);
    if (attacker) {
      attacker.setTarget(targetId);
    }
  }

  public clearPlayerTarget(attackerId: string) {
    const attacker = this.getPlayer(attackerId);
    if (attacker) {
      attacker.clearTarget();
    }
  }
}
