/**
 * Would this change leave nobody able to manage roles?
 *
 * Split out as a pure predicate because it is the one rule here with no safe way back: once the
 * last grant of `role:manage` is gone, the screen that could restore it is unreachable and the
 * fix is a database client. It is also the one rule an end-to-end test cannot reach, since
 * triggering it means reducing the whole system to a single grant.
 *
 * @param roleGrantsManage - Does the role being changed currently grant it?
 * @param changeKeepsManage - Will it still grant it afterwards? `false` for a delete.
 * @param anotherRoleGrantsManage - Does any *other* role grant it?
 */
export function wouldOrphanRoleManage({
  roleGrantsManage,
  changeKeepsManage,
  anotherRoleGrantsManage,
}: {
  roleGrantsManage: boolean;
  changeKeepsManage: boolean;
  anotherRoleGrantsManage: boolean;
}): boolean {
  if (!roleGrantsManage) return false; // nothing to lose
  if (changeKeepsManage) return false; // still granted here
  return !anotherRoleGrantsManage; // only a problem when no one else grants it
}
