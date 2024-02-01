import { MAX_HEALTH, Player, PlayerStatus } from './player';

export class PlayerDTO {
  private id: string;
  private health = MAX_HEALTH;
  private maxHealth = MAX_HEALTH;
  private ac = 11;
  private numberOfHeals = 2;
  private healsUsed = 0;
  private targetId: string | null = null;
  private characterInfo = null; // or some default value
  private status: PlayerStatus = 'idle';
  constructor(player: Player) {
    this.id = player.getId();
    this.health = player.getHealth();
    this.ac = player.getAC();
    this.maxHealth = player.getMaxHealth();
    this.numberOfHeals = player.getNumberOfHeals();
    this.healsUsed = player.getHealsUsed();
    this.targetId = player.getTarget();
    this.characterInfo = player.getCharacterInfo();
    this.status = player.getStatus();
  }

  // Optionally, add a method to convert back to a Player instance
  static fromDTO(playerDTO: PlayerDTO): Player {
    const player = new Player(playerDTO.id);
    player.setHealth(playerDTO.health);
    player.setAC(playerDTO.ac);
    player.setNumberOfHeals(playerDTO.numberOfHeals);
    player.setMaxHealth(playerDTO.maxHealth);
    player.setHealsUsed(playerDTO.healsUsed);
    player.setTarget(playerDTO.targetId);
    player.setCharacterInfo(playerDTO.characterInfo);
    player.setStatus(playerDTO.status);
    return player;
  }
}
