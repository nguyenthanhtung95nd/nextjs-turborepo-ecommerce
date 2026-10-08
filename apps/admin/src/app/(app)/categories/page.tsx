import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { TaxonomyScreen } from "@/features/taxonomy/components/taxonomy-screen";
import { TAXONOMY } from "@/features/taxonomy/kinds";

export const metadata = { title: "Categories" };

const KIND = "category";

export default async function CategoriesRoute() {
  const session = await auth();

  // Defence in depth: the nav already hides this section, but a typed URL must not reach data.
  if (!hasPermission(session, TAXONOMY[KIND].permission)) {
    return <PermissionDenied action={`manage ${TAXONOMY[KIND].pluralLower}`} />;
  }

  return <TaxonomyScreen kind={KIND} />;
}
