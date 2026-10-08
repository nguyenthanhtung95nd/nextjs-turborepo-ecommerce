import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { ProductEditScreen } from "@/features/products/components/product-edit-screen";

// The product's name is fetched in the browser now, so the tab title stays generic rather than
// making the server fetch the same record a second time just to name it.
export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session, "product:update")) {
    return <PermissionDenied action="edit products" />;
  }

  const { id } = await params;
  return <ProductEditScreen id={id} canDelete={hasPermission(session, "product:delete")} />;
}
