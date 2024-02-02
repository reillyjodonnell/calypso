import { Weapon } from './weapon';

export class WeaponDTO {
  id: string;
  name: string;
  equipped: boolean;
  description: string;
  type: string;
  rarity: string;
  price: number;
  emoji: string;
  damage: string;
  rollToHit: string;
  critHit: number[];
  critFail: number[];
  critChance: number;
  critFailChance: number;

  constructor(weapon: Weapon) {
    this.id = weapon.getId();
    this.name = weapon.getName();
    this.equipped = weapon.getEquipped();
    this.description = weapon.getDescription();
    this.type = weapon.getType();
    this.rarity = weapon.getRarity();
    this.price = weapon.getPrice();
    this.emoji = weapon.getEmoji();
    this.damage = weapon.getDamage();
    this.rollToHit = weapon.getRollToHit();
    this.critHit = weapon.getCritHit();
    this.critFail = weapon.getCritFail();
    this.critChance = weapon.getCritChance();
    this.critFailChance = weapon.getCritFailChance();
  }

  // Optionally, add a method to convert back to a Weapon instance
  static fromDTO(weaponDTO: WeaponDTO): Weapon {
    const weapon = new Weapon({
      equipped: weaponDTO.equipped,
      id: weaponDTO.id,
      name: weaponDTO.name,
      description: weaponDTO.description,
      type: weaponDTO.type,
      rarity: weaponDTO.rarity,
      price: weaponDTO.price,
      emoji: weaponDTO.emoji,
      damage: weaponDTO.damage,
      rollToHit: weaponDTO.rollToHit,
      critHit: weaponDTO.critHit,
      critFail: weaponDTO.critFail,
      critChance: weaponDTO.critChance,
      critFailChance: weaponDTO.critFailChance,
    });

    return weapon;
  }
}
