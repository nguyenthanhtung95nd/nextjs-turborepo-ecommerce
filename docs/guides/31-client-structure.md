# Cấu trúc thư mục CLIENT

Tài liệu này trả lời: **tôi vừa viết một file trong `apps/client`, nó thuộc về đâu?**

## Quy tắc trong sáu dòng

```
app/          CHỈ file đặc biệt của Next.js
              page · layout · loading · error · not-found · route · sitemap · robots
components/   UI
  <domain>/     chỉ MỘT domain dùng
  (gốc)         từ HAI domain trở lên dùng
lib/          logic — không chứa JSX
  <domain>/     queries = đọc · actions = ghi
```

Ba câu hỏi để quyết định, theo thứ tự:

| Câu hỏi | Nếu đúng |
| --- | --- |
| Next.js có tự gọi file này theo tên không? | `app/` |
| Nó có trả về JSX không? | `components/` |
| Còn lại | `lib/` |

Rồi hỏi tiếp: **mấy domain dùng nó?** Một thì vào thư mục domain, từ hai trở lên thì ra gốc.

CLIENT gom theo **tầng**, không gom theo domain như ADMIN. Lý do: nó fetch ngay trong `page.tsx`,
nên một domain chỉ còn hai mảnh — vài hàm query và vài component. Hai mảnh thì không cần một thư
mục riêng để gom. Xem [Cấu trúc thư mục ADMIN](./21-admin-structure.md) để so sánh.

## Cây thư mục

```
apps/client/src/
├── app/
│   ├── layout.tsx  globals.css  favicon.ico
│   ├── error.tsx  not-found.tsx  global-error.tsx
│   ├── robots.ts  sitemap.ts
│   ├── api/auth/[...nextauth]/route.ts      route handler DUY NHẤT
│   ├── (home)/              page · loading
│   ├── products/
│   │   ├── (listing)/       page · loading
│   │   └── [slug]/          page           ← không có loading.tsx, xem phần bẫy
│   ├── categories/[slug]/page.tsx
│   ├── brands/[slug]/page.tsx
│   ├── search/              page · loading
│   └── login/ · register/ · account/
│
├── components/
│   ├── site-header · site-footer · mobile-menu
│   ├── state-panel · skeleton-bar · product-card · product-grid
│   │     ↑ gốc: product-grid dùng bởi trang chủ và trang danh sách
│   ├── home/            home-hero · category-tiles
│   ├── catalog/         7 file
│   ├── product-detail/  5 file   (chỉ trang [slug] dùng)
│   ├── auth/            auth-card · form-alert · form-field · login-form · register-form
│   └── account/         change-password-form · sign-out-button
│
└── lib/
    ├── site-url.ts
    ├── auth/      actions · safe-redirect
    ├── account/   actions
    └── catalog/   queries · url · pricing · labels
```

| Thư mục `lib/` | Nội dung |
| --- | --- |
| `catalog/queries.ts` | Mọi lời gọi API của storefront, kèm `revalidate` và `tags` |
| `catalog/url.ts` | Dựng href cho bộ lọc |
| `catalog/pricing.ts` | Tính giá hiển thị, phần trăm giảm |
| `catalog/labels.ts` | Chữ hiển thị cho tuỳ chọn sắp xếp |
| `auth/actions.ts` | Server action đăng nhập, đăng ký |
| `auth/safe-redirect.ts` | Lọc tham số `next` để không bị chuyển hướng sang domain lạ |
| `account/actions.ts` | Server action đổi mật khẩu |
| `site-url.ts` | Dựng URL tuyệt đối cho sitemap và metadata |

`auth/` là **vào và ra**; `account/` là **quản lý tài khoản của chính mình**. ADMIN chia y hệt, nên
cùng một loại hàm nằm cùng một chỗ ở cả hai app.

---

## Ranh giới server và client

Số đo thật trên `apps/client`:

| Chỉ số | Giá trị |
| --- | --- |
| Tổng file `.tsx` | 44 |
| File `.tsx` có `"use client"` | 9 |
| Trong đó là `error.tsx` / `global-error.tsx` (Next.js **bắt buộc**) | 2 |
| `page.tsx` là Client Component | **0 / 9** |
| Route handler | 1 |

Chỉ 9 trên 44 file là client, và 2 trong số đó là bắt buộc. Phần còn lại là những chỗ thật sự cần
tương tác: drawer bộ lọc, gallery ảnh, form.

```tsx
// app/products/(listing)/page.tsx — Server Component, fetch ngay tại đây
export default async function ProductsPage({ searchParams }: Props) {
  const params = catalogListParamsSchema.parse(await searchParams);
  const result = await listProducts(params); // chạy trên server
  return <ProductGrid products={result.products} />; // truyền dữ liệu xuống
}
```

```tsx
// components/catalog/filter-drawer.tsx — lá, cần state nên mới là client
"use client";

export function FilterDrawer({ ... }) { ... }
```

Quy tắc: **page lấy dữ liệu và quyết định, component nhận props và vẽ.**

---

## Ba cái bẫy của App Router

Ba lỗi dưới đây đã xảy ra thật. Chúng đều biên dịch sạch và không báo lỗi gì.

### 1. `loading.tsx` làm mất mã 404

`loading.tsx` tạo ra một Suspense boundary. Khi có boundary, Next.js **bắt đầu stream** response —
mã trạng thái HTTP đã gửi đi trước khi code kịp gọi `notFound()`.

Hậu quả: trang trả **200 OK** kèm nội dung "không tìm thấy". Next đánh dấu HTML đó `noindex` nên
công cụ tìm kiếm vẫn an toàn, nhưng một mã 200 che mất mọi link gãy khỏi log và analytics.

Vì vậy:

```
products/(listing)/loading.tsx      CÓ    — trang danh sách không bao giờ 404
products/[slug]/                    KHÔNG — phải 404 được khi sản phẩm không tồn tại
categories/[slug]/ · brands/[slug]/ KHÔNG — cùng lý do
account/                            KHÔNG — cần redirect được
```

**Quy tắc: route nào cần `notFound()` hoặc `redirect()` thì không được có `loading.tsx`.**

Chi phí bỏ skeleton ở trang chi tiết gần như bằng không, vì các trang đó đã được prerender: một
sản phẩm thật đã dựng sẵn, và bản cũ vẫn được phục vụ trong lúc revalidate.

### 2. `loading.tsx` ở gốc `app/` áp cho _mọi_ route

Một `app/loading.tsx` không chỉ áp cho `/`. Nó bọc **toàn bộ** route trong ứng dụng — skeleton của
trang chủ hiện lên ở trang chi tiết sản phẩm, và theo bẫy số 1, không route nào còn 404 được nữa.

Cách sửa là **route group**: bọc thư mục trong ngoặc đơn để giới hạn phạm vi mà không đổi URL.

```
app/(home)/page.tsx                 → URL vẫn là  /
app/(home)/loading.tsx              → skeleton chỉ áp cho  /

app/products/(listing)/loading.tsx  → không chạm tới  /products/[slug]
```

Ngoặc đơn bị loại khỏi URL. `(home)` và `(listing)` không xuất hiện ở đâu cả.

### 3. `error.tsx` bắt buộc là Client Component

Next.js yêu cầu như vậy — nó cần `onClick` cho nút thử lại. Đây là lý do 2 trong 9 file
`"use client"` của CLIENT là file lỗi. Không phải lựa chọn thiết kế, mà là ràng buộc framework.

`global-error.tsx` là trường hợp riêng: nó thay cả `<html>` và `<body>`, dùng khi chính root
layout hỏng.

---

## Schema và type không nằm trong app

```ts
import { catalogListParamsSchema, type ProductCardDto } from "@repo/contracts";
```

Không có `lib/<domain>/schema.ts` re-export lại. Nhãn hiển thị thì ngược lại — chúng ở lại app:

```ts
// apps/client/src/lib/catalog/labels.ts
/** UI copy for the sort control. Wording belongs to the storefront, not to the shared contract. */
export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  // ...
};
```

"Newest first" là chữ trên màn hình, không phải quy tắc nghiệp vụ.

---

## Đặt tên

| Loại | Quy ước | Ví dụ |
| --- | --- | --- |
| File component | `kebab-case.tsx` | `product-card.tsx` |
| Component bên trong | `PascalCase` | `export function ProductCard()` |
| File logic | `kebab-case.ts` | `site-url.ts` |
| Thư mục route | `kebab-case` | `app/products/` |
| Dynamic segment | `[param]` | `app/products/[slug]/page.tsx` |

---

## Tự kiểm tra

```bash
# 1. Không có component nào trong app/ ngoài file đặc biệt của Next
find apps/client/src/app -name "*.tsx" ! -name "page.tsx" ! -name "layout.tsx" \
  ! -name "error.tsx" ! -name "loading.tsx" ! -name "not-found.tsx" ! -name "global-error.tsx"

# 2. Không có file nào trong lib/ chứa JSX
grep -rl "</" apps/client/src/lib

# 3. Không có "use client" trong page.tsx
grep -rl "use client" apps/client/src/app --include=page.tsx

# 4. Route nào có notFound() thì không được có loading.tsx cùng cấp
grep -rl "notFound()" apps/client/src/app
```

Ba lệnh đầu không in ra gì là đúng; lệnh thứ tư in ra danh sách route cần kiểm bằng mắt.

## Đọc tiếp

- [CLIENT làm gì](./30-client-overview.md) — vì sao server-first
- [Lấy dữ liệu trong CLIENT](./32-client-data-fetching.md) — `lib/catalog/queries.ts` làm gì
- [Cấu trúc thư mục ADMIN](./21-admin-structure.md) — app còn lại tổ chức ngược lại
