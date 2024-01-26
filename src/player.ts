const MAX_HEALTH = 20;
export class Player {
  private health = MAX_HEALTH;
  private ac = 13;
  private isTurn = false;
  private initiative = 0;
  private targetting_id = '';

  constructor(private readonly id: string) {}

  public setInitiative(initiative: number) {
    this.initiative = initiative;
  }
  public getInitiative() {
    return this.initiative;
  }

  public getId() {
    return this.id;
  }
  public getHealth() {
    return this.health;
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
    // make sure it doesn't exceed max health
    if (this.health + heal > MAX_HEALTH) {
      this.health = MAX_HEALTH;
      return;
    }
    this.health += heal;
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

  public isPlayersTurn() {
    return this.isTurn;
  }

  public startPlayersTurn() {
    this.isTurn = true;
  }

  public endPlayersTurn() {
    this.isTurn = false;
  }

  public setTargettingId(id: string) {
    this.targetting_id = id;
  }

  public getTargettingId() {
    return this.targetting_id;
  }
}

// we should be able to interact between player instances

export class PlayerManager {
  private players: Player[] = [];
  private turnOrder: Player[] = [];

  public addPlayer(playerid: string) {
    const player = new Player(playerid);
    this.players.push(player);
  }

  public setTurnOrder() {
    this.turnOrder = [...this.players].sort(
      (a, b) => b.getInitiative() - a.getInitiative()
    );
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

  public setPlayerInitiative(id: string, initiative: number) {
    const player = this.getPlayer(id);
    if (!player) throw new Error('player not found!');
    player.setInitiative(initiative);
  }

  public doesAttackHitPlayer(defender: Player, roll: number) {
    return roll >= defender.getAC();
  }
  //attack a player with damage
  public attackPlayer(defender: Player, attack: number) {
    defender.hurt(attack);
    return defender.getHealth();
  }

  public healPlayer(player: Player, heal: number) {
    player.heal(heal);
    return player.getHealth();
  }

  public isPlayerDead(player: Player) {
    return player.isPlayerDead();
  }

  public haveAllPlayersRolledForinitiative() {
    return this.players.every((player) => player.getInitiative() > 0);
  }

  public resetPlayersInitiative() {
    this.players.forEach((player) => player.setInitiative(0));
  }

  public nextPlayersTurn() {
    if (this.turnOrder.length === 0) {
      this.setTurnOrder(); // Set the turn order if not already set
    }

    // Move the first player to the end of the array
    const currentPlayer = this.turnOrder.shift();
    if (!currentPlayer) return;
    currentPlayer?.endPlayersTurn();
    this.turnOrder.push(currentPlayer);

    // Start the next player's turn
    const nextPlayer = this.turnOrder[0];
    nextPlayer?.startPlayersTurn();
  }

  public getCurrentPlayer() {
    return this.players.find((player) => player.isPlayersTurn());
  }

  public getPlayerWithHighestInitiative() {
    return this.players.reduce((prev, current) => {
      return prev.getInitiative() > current.getInitiative() ? prev : current;
    });
  }
}
