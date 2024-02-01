export function playersTurnResponse({
  id,
  health,
  maxHealth,
}: {
  id: string;
  health: number;
  maxHealth: number;
}) {
  return `<@${id}> it's your turn!\n\n\`You have ${health}/${maxHealth} health.\``;
}
