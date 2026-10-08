import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { ProductCreateScreen } from "@/features/products/components/product-create-screen";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const session = await auth();
  if (!hasPermission(session, "product:create")) {
    return <PermissionDenied action="create products" />;
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It will be saved as a draft unless you choose another status.
        </p>
      </div>

      <ProductCreateScreen />
    </>
  );
}
