import { EmbedBuilder } from 'discord.js';
import { Player } from '../player/player';
import { Weapon } from '../item/weapon';

export function createStatsEmbed(
  playerName: string,
  player: Player,
  weapon: Weapon
) {
  const embed = new EmbedBuilder()
    .setTitle(`Player Stats: ${playerName}`)
    .setColor(0x0099ff)
    .addFields(
      {
        name: 'Health',
        value: `${player.getHealth()} / ${player.getMaxHealth()}`,
        inline: true,
      },
      {
        name: 'Heals Left',
        value: `${
          player.getNumberOfHeals() - player.getHealsUsed()
        } / ${player.getNumberOfHeals()}`,
        inline: true,
      }
    );

  if (weapon) {
    embed.addFields({
      name: weapon.getName(),
      value: [
        `**Damage**: ${weapon.getDamage()}`,
        `**Crit on**: ${weapon.getCritHit().join(', ')}`,
        `**Fail on**: ${weapon.getCritFail().join(', ')}`,
      ].join('\n'),
    });
  }

  return embed;
}
