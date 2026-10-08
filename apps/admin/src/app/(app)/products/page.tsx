import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { ProductsScreen } from "@/features/products/components/products-screen";

export const metadata = { title: "Products" };

/**
 * Stays a Server Component for one reason: deciding who may see this screen before its code is
 * sent. The data itself is fetched in the browser.
 */
export default async function ProductsPage() {
  const session = await auth();
  // Defence in depth: the nav already hides this section, but a typed URL must not reach the data.
  if (!hasPermission(session, "product:read")) {
    return <PermissionDenied action="view products" />;
  }

  return (
    <ProductsScreen
      canCreate={hasPermission(session, "product:create")}
      canUpdate={hasPermission(session, "product:update")}
      canDelete={hasPermission(session, "product:delete")}
    />
  );
}
