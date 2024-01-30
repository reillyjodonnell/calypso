export function playersTurnResponse({
  id,
  health,
  maxHealth,
}: {
  id: string;
  health: number;
  maxHealth: number;
}) {
  return `<@${id}> it's your turn! Use /attack to begin the attack.\n\n\`You have ${health}/${maxHealth} health.\``;
}
