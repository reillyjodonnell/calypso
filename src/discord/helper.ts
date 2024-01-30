export function generateUniqueId({
  action,
  guildId,
  threadId,
}: {
  action: string;
  guildId: string;
  threadId: string;
}) {
  if (!guildId) {
    throw new Error('Missing guildId');
  }
  if (!threadId) {
    throw new Error('Missing threadId');
  }

  if (!action) {
    throw new Error('Missing action');
  }

  const uniqueId = `${guildId}/${threadId}/${action}`;
  return uniqueId;
}
