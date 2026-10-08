# Thêm một màn hình vào ADMIN

Công thức lặp lại để nối một endpoint của API vào một màn hình quản trị. Mọi màn hình trong
`apps/admin` đều đi theo đúng các bước này.

**Mục tiêu:** thêm một màn hình mới mà không phải tự nghĩ ra kiến trúc.

## Trước khi bắt đầu

- Endpoint đã tồn tại ở API — xem [Thêm một endpoint](./15-api-add-endpoint.md)
- Đã đọc [Luồng dữ liệu ADMIN](./22-admin-data-flow.md)

Ví dụ xuyên suốt: màn hình quản lý `coupons`.

## Bản đồ

```
1. app/api/coupons/route.ts            route handler — uỷ quyền ra API
2. features/coupons/services.ts        gọi route handler, nắn dữ liệu
3. features/coupons/errors.ts          dịch lỗi
4. features/coupons/api/use-coupons.ts hook useQuery / useMutation
5. features/coupons/components/        màn hình, đủ bốn trạng thái
6. app/(app)/coupons/page.tsx          Server Component kiểm quyền
   + error.tsx + loading.tsx
7. components/nav-items.ts             thêm mục vào sidebar
```

---

## Bước 1 — Route handler

```ts
// apps/admin/src/app/api/coupons/route.ts
import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

export async function GET() {
  return proxy("/coupons");
}

export async function POST(request: NextRequest) {
  return proxy("/coupons", "POST", await request.json());
}
```

```ts
// apps/admin/src/app/api/coupons/[id]/route.ts
type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxy(`/coupons/${encodeURIComponent(id)}`, "DELETE");
}
```

`params` là một Promise trong Next 16 — phải `await`. Và luôn `encodeURIComponent` cho giá trị
lấy từ URL.

**Không viết quy tắc nghiệp vụ ở đây.** Route handler chỉ uỷ quyền.

## Bước 2 — `services.ts`

```ts
// apps/admin/src/features/coupons/services.ts
import type { CouponDto, CouponFormInput } from "@repo/contracts";
import { apiClient } from "@/services/api-client";

/** A coupon as the admin table shows it — not the API's shape. */
export interface CouponRow {
  id: string;
  code: string;
  percentOff: number;
  createdAt: Date;
}

export async function fetchCoupons(): Promise<CouponRow[]> {
  const { data } = await apiClient.get<CouponDto[]>("/coupons");
  return data.map((coupon) => ({ ...coupon, createdAt: new Date(coupon.createdAt) }));
}

export async function createCoupon(input: CouponFormInput): Promise<void> {
  await apiClient.post("/coupons", input);
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiClient.delete(`/coupons/${encodeURIComponent(id)}`);
}
```

`apiClient` có `baseURL: "/api"`, nên `"/coupons"` ở đây là route handler ở Bước 1, không phải
NestJS.

Hai việc bắt buộc của tầng này: **hồi sinh `Date`** và **trả về kiểu của màn hình**, không phải
kiểu của API.

## Bước 3 — `errors.ts`

```ts
// apps/admin/src/features/coupons/errors.ts
import { ApiError } from "@repo/api-client";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";
import type { CouponFormInput } from "@repo/contracts";

export type CouponResult = ActionResult<CouponFormInput>;

export function toCouponFailure(error: unknown): CouponResult {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return { ok: false, error: "You don't have permission to manage coupons." };
    }
    if (error.status === 404) return { ok: false, error: "That coupon no longer exists." };
    if (error.status === 409) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: { code: error.message } };
    }
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors };
    }
  }
  console.error("[coupons] write failed", error);
  return { ok: false, error: "Couldn't save the coupon. Please try again." };
}
```

Bảng ánh xạ dùng cho mọi domain:

| API trả | Màn hình hiển thị |
| --- | --- |
| 400 | `fieldErrors` từ body, hiện dưới từng ô nhập |
| 403 | Một câu nói rõ thao tác nào bị từ chối |
| 404 | "Không còn tồn tại" |
| 409 | `fieldErrors` trên đúng ô gây xung đột |
| 5xx | Câu chung, chi tiết ghi vào log phía server |

Giữ hàm này **thuần**: không gọi mạng, không đụng state. Nhờ vậy nó test được bằng một dòng.

## Bước 4 — Hook

```ts
// apps/admin/src/features/coupons/api/use-coupons.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCoupon, deleteCoupon, fetchCoupons } from "../services";

export const couponListKey = ["coupons", "list"] as const;

export function useCoupons() {
  return useQuery({ queryKey: couponListKey, queryFn: fetchCoupons });
}

function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["coupons"] });
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({ mutationFn: createCoupon, onSuccess: invalidate });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({ mutationFn: deleteCoupon, onSuccess: invalidate });
}
```

Hai quy tắc không được bỏ:

- `queryKey` chứa **mọi** tham số ảnh hưởng tới kết quả (ở đây chưa có bộ lọc nên key là hằng số;
  có bộ lọc thì phải đưa cả object params vào)
- Mọi `useMutation` đều `invalidateQueries` theo **tiền tố** của domain

## Bước 5 — Màn hình, đủ bốn trạng thái

```tsx
// apps/admin/src/features/coupons/components/coupons-screen.tsx
"use client";

interface Props {
  canManage: boolean;
}

export function CouponsScreen({ canManage }: Props) {
  const coupons = useCoupons();

  if (coupons.isPending) return <CouponsSkeleton />;

  return (
    <div className={TABLE_SURFACE}>
      {coupons.isError ? (
        <StatePanel
          tone="destructive"
          title="Couldn't load coupons"
          description="Something went wrong on our side. Try again in a moment."
        >
          <Button variant="outline" onClick={() => void coupons.refetch()}>
            Try again
          </Button>
        </StatePanel>
      ) : coupons.data.length === 0 ? (
        <CouponsEmptyState canManage={canManage} />
      ) : (
        <CouponTable rows={coupons.data} canManage={canManage} />
      )}
    </div>
  );
}
```

Màn hình thiếu một trong bốn trạng thái là màn hình chưa xong.

## Bước 6 — Page, error, loading

```tsx
// apps/admin/src/app/(app)/coupons/page.tsx — Server Component
import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { CouponsScreen } from "@/features/coupons/components/coupons-screen";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const session = await auth();
  if (!hasPermission(session, "coupon:read")) {
    return <PermissionDenied action="view coupons" />;
  }

  return <CouponsScreen canManage={hasPermission(session, "coupon:manage")} />;
}
```

```tsx
// apps/admin/src/app/(app)/coupons/error.tsx
"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function CouponsError({ reset }: { reset: () => void }) {
  return <RouteErrorState onRetry={reset} />;
}
```

`error.tsx` **bắt buộc** có `"use client"` — Next.js yêu cầu, vì nó cần `onClick`.

## Bước 7 — Sidebar

```ts
// apps/admin/src/components/nav-items.ts
export type NavIcon = "dashboard" | "products" | "categories" | "brands" | "users" | "roles" | "coupons";

export const NAV_ITEMS: readonly NavItem[] = [
  // ...
  { href: "/coupons", label: "Coupons", permission: "coupon:read", icon: "coupons" },
];
```

`icon` là một **chuỗi**, không phải component. Component icon thật được tra ở `app-shell.tsx` —
đó là file `"use client"`, và một icon của `lucide-react` đi qua ranh giới server/client sẽ không
serialize được.

File này **không** có `"use client"`, và không được gộp vào `app-shell.tsx`: layout là Server
Component và cần đọc mảng thật để lọc theo quyền.

---

## Kiểm tra

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Rồi mở màn hình trong trình duyệt và kiểm bốn điều:

| Kiểm | Cách làm |
| --- | --- |
| Bốn trạng thái | Tắt API → thấy panel lỗi, không phải trang trắng |
| Cache | Rời màn hình rồi quay lại → hiện ngay, không có request mới |
| Vô hiệu hoá cache | Tạo một bản ghi → bảng cập nhật mà không cần F5 |
| Quyền | Đăng nhập bằng tài khoản thiếu quyền → thấy `PermissionDenied`, và sidebar không có mục đó |

## Danh sách kiểm

- [ ] Route handler chỉ gọi `proxy()`, không chứa quy tắc nghiệp vụ
- [ ] `services.ts` hồi sinh `Date` và trả về kiểu của màn hình
- [ ] `errors.ts` là hàm thuần, phủ 400 / 403 / 404 / 409 / 5xx
- [ ] `queryKey` chứa mọi tham số ảnh hưởng kết quả
- [ ] Mọi `useMutation` có `onSuccess: invalidate`
- [ ] Màn hình có đủ: đang tải · lỗi · rỗng · có dữ liệu
- [ ] `page.tsx` là Server Component và kiểm quyền
- [ ] Có `error.tsx` (`"use client"`) và `loading.tsx`
- [ ] Mục sidebar có `permission` đúng

## Đọc tiếp

- [Luồng dữ liệu ADMIN](./22-admin-data-flow.md) — vì sao từng tầng tồn tại
- [Cấu trúc thư mục ADMIN](./21-admin-structure.md)
- [Thêm một tính năng](./03-add-a-feature.md) — thứ tự tổng thể qua cả ba project
