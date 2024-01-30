type PlayerStatus = 'idle' | 'attacking' | 'healing' | 'dead';
const MAX_HEALTH = 14;
export class Player {
  private readonly maxHealth = MAX_HEALTH;
  private health = MAX_HEALTH;
  private ac = 11;
  private numberOfHeals = 2;
  private healsUsed = 0;
  private targetId: string | null = null;
  private gold = 0;
  private characterInfo = null; // or some default value
  private status: PlayerStatus = 'idle';

  constructor(private readonly id: string) {}

  public setStatus(status: PlayerStatus) {
    this.status = status;
  }
  public getStatus() {
    return this.status;
  }

  public getMaxHealth() {
    return this.maxHealth;
  }

  public getId() {
    return this.id;
  }
  public getHealth() {
    return this.health;
  }
  // Method to get gold
  public getGold() {
    return this.gold;
  }

  // Method to update gold
  public updateGold(amount: number) {
    this.gold += amount;
  }

  // Method to get character info
  public getCharacterInfo() {
    return this.characterInfo;
  }

  // Method to set character info
  public setCharacterInfo(info: any) {
    this.characterInfo = info;
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

  public declareAttack(playerId: string) {
    const player = this.getPlayer(playerId);
    if (!player) throw new Error("Player doesn't exist");
    player.setStatus('attacking');
  }

  public getPlayerHealthById(playerId: string) {
    const player = this.getPlayer(playerId);
    if (!player) throw new Error("Player doesn't exist");
    return player.getHealth();
  }

  public getPlayerMaxHealthById(playerId: string) {
    const player = this.getPlayer(playerId);
    if (!player) throw new Error("Player doesn't exist");
    return player.getMaxHealth();
  }

  executeRandomOutcome(playerId: string): {
    description: string;
    isPlayerDead?: boolean;
  } {
    const outcomes = ['selfHarm', 'noEffect'];
    const selectedOutcome = this.getRandomOutcome(outcomes);
    const player = this.getPlayer(playerId);

    if (!player) throw new Error("Player doesn't exist");

    switch (selectedOutcome) {
      case 'selfHarm':
        const damageRange = [1, 2];

        const damage = chooseRandomly(damageRange);

        player.hurt(damage);
        // Apply self-harm logic, like reducing player's health
        const isPlayerDead = player.isPlayerDead();
        return {
          isPlayerDead,
          description: `You swing at your target, but miss and hit yourself for ${damage} damage! ${
            isPlayerDead
              ? 'You have died!'
              : `You have ${player.getHealth()} health remaining.`
          }`,
        };
      case 'noEffect':
        return {
          description: `You swing at your target and miss terribly. Somehow you recovered!`,
        };
      case 'fallDown':
        return {
          description: `You swing at your target but the momentum of your swing causes you to fall down. You've lost a turn!`,
        };

      default:
        throw new Error('Invalid outcome');
    }
  }

  getRandomOutcome(outcomes: Array<string>) {
    const randomIndex = Math.floor(Math.random() * outcomes.length);
    return outcomes[randomIndex];
  }
}

function chooseRandomly<T>(options: T[]): T {
  if (options.length !== 2) {
    throw new Error('Array must contain exactly two elements.');
  }

  const randomIndex = Math.random() < 0.5 ? 0 : 1;
  return options[randomIndex];
}
