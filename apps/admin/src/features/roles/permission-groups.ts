export interface PermissionOption {
  id: string;
  key: string;
  description: string | null;
}

export interface PermissionGroup {
  label: string;
  permissions: PermissionOption[];
}

/**
 * Which heading each permission prefix sits under.
 *
 * Grouping straight by prefix would give eight permissions five headings, three of them holding
 * a single row. These labels collapse the related ones; a prefix that is not listed falls back
 * to {@link OTHER_GROUP} rather than disappearing.
 */
const GROUP_BY_PREFIX: Record<string, string> = {
  product: "Products",
  category: "Catalog",
  brand: "Catalog",
  user: "Administration",
  role: "Administration",
};

const GROUP_ORDER = ["Products", "Catalog", "Administration"];
const OTHER_GROUP = "Other";

/** `"product:create"` → `"product"`. Keys without a colon are their own prefix. */
function prefixOf(key: string): string {
  return key.split(":")[0] ?? key;
}

function labelFor(key: string): string {
  return GROUP_BY_PREFIX[prefixOf(key)] ?? OTHER_GROUP;
}

function orderOf(label: string): number {
  const index = GROUP_ORDER.indexOf(label);
  // Unlisted groups sort after the known ones instead of jumping to the front.
  return index === -1 ? GROUP_ORDER.length : index;
}

/**
 * Buckets the permission catalog under readable headings.
 *
 * Empty groups are never emitted, so a catalog that loses a whole prefix does not leave a
 * heading with nothing beneath it.
 */
export function groupPermissions(permissions: readonly PermissionOption[]): PermissionGroup[] {
  const byLabel = new Map<string, PermissionOption[]>();

  for (const permission of permissions) {
    const label = labelFor(permission.key);
    const bucket = byLabel.get(label);
    if (bucket) bucket.push(permission);
    else byLabel.set(label, [permission]);
  }

  return [...byLabel.entries()]
    .map(([label, items]) => ({
      label,
      permissions: [...items].sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => orderOf(a.label) - orderOf(b.label) || a.label.localeCompare(b.label));
}
