export function createWagerId({
  guildId,
  threadId,
  playerToBetOn,
  action,
}: {
  guildId: string | null;
  threadId: string | null;
  playerToBetOn: string | null;
  action: string;
}) {
  if (!guildId) {
    throw new Error('Missing guildId');
  }
  if (!threadId) {
    throw new Error('Missing threadId');
  }
  if (!playerToBetOn) {
    throw new Error('Missing playerToBetOn');
  }
  if (!action) {
    throw new Error('Missing action');
  }

  const uniqueId = `${guildId}/${threadId}/${playerToBetOn}/${action}`;
  return uniqueId;
}
export function parseWagerId(wagerId: string) {
  const [guildId, threadId, playerToBetOn, action] = wagerId.split('/');
  return { guildId, threadId, playerToBetOn, action };
}
