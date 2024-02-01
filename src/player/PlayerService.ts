import { Player } from './player';

export class PlayerService {
  public doesAttackHitPlayer(defender: Player, roll: number) {
    return roll >= defender.getAC();
  }
  //attack a player with damage
  public attackPlayer(defender: Player, attack: number) {
    defender.hurt(attack);
    return defender.getHealth();
  }
  public isPlayerDead(player: Player) {
    return player.isPlayerDead();
  }

  public attackTarget(defender: Player, damage: number) {
    const targetHealthRemaining = this.attackPlayer(defender, damage);
    const isTargetDead = this.isPlayerDead(defender);
    return { targetHealthRemaining, isTargetDead };
  }
  public setPlayerTarget(attacker: Player, target: Player) {
    attacker.setTargetId(target.getId());
  }
  public clearPlayerTarget(attacker: Player) {
    attacker.clearTarget();
  }

  public healPlayer(player: Player, heal: number) {
    const healSuccess = player.heal(heal);
    return { healthRemaining: player.getHealth(), healSuccess };
  }
  public getPlayerHealth(player: Player) {
    return player.getHealth();
  }

  public getPlayerMaxHealth(player: Player) {
    return player.getMaxHealth();
  }

  public harmSelf(player: Player, damage: number) {
    player.hurt(damage);
    // check if theyre dead
    const isPlayerDead = player.isPlayerDead();
    return { isPlayerDead, healthRemaining: player.getHealth() };
  }
}
