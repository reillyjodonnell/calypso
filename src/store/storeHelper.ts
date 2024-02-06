export function parseIdFromStoreAction(action: string) {
  // store action is like action_1
  return action.split('_')[1];
}
