# Cấu trúc thư mục ADMIN

Tài liệu này trả lời: **tôi vừa viết một file trong `apps/admin`, nó thuộc về đâu?**

## Quy tắc trong bảy dòng

```
app/          CHỈ file đặc biệt của Next.js
              page · layout · loading · error · not-found · route
features/     một thư mục một domain, chứa đủ mọi thứ của domain đó
              services.ts · errors.ts · api/use-*.ts · components/
components/   UI dùng chung từ HAI domain trở lên
services/     api-client.ts (trình duyệt) · api-proxy.ts (server)
providers/    QueryClientProvider
```

Ba câu hỏi để quyết định, theo thứ tự:

| Câu hỏi | Nếu đúng |
| --- | --- |
| Next.js có tự gọi file này theo tên không? | `app/` |
| Nó chỉ phục vụ **một** domain không? | `features/<domain>/` |
| Từ hai domain trở lên dùng | `components/` hoặc `services/` |

ADMIN **không có `lib/`** và **không có file `"use server"`** nào.

## Cây thư mục

```
apps/admin/src/
├── auth.ts                       điểm vào Auth.js
├── app/
│   ├── layout.tsx                bọc QueryProvider
│   ├── login/page.tsx
│   ├── api/                      22 route handler — cầu nối duy nhất ra API
│   │   ├── session/              POST đăng nhập · DELETE đăng xuất
│   │   ├── products/ · taxonomy/[kind]/ · users/ · roles/
│   │   ├── account/ · permissions/
│   │   └── auth/[...nextauth]/
│   └── (app)/                    route group — mọi trang sau đăng nhập
│       ├── layout.tsx            cổng kiểm tra phiên
│       ├── page.tsx  loading  error  not-found
│       └── products/ · categories/ · brands/ · users/ · roles/ · settings/
│
├── features/                     products 26 · users 17 · roles 15
│   │                             taxonomy 10 · account 7 · dashboard 4 · auth 4
│   └── <domain>/                 services · errors · api/ · components/
│
├── components/                   14 file dùng chung
│   app-shell · nav-items · panel · form-field · pagination · url-search-field
│   confirm-delete-dialog · responsive-table · state-panel · not-found-panel
│   route-error-state · permission-denied · forbidden · service-unavailable
│
├── services/    api-client.ts (axios cho trình duyệt) · api-proxy.ts (cho route handler)
└── providers/   query-provider.tsx
```

## Một domain gồm những gì

```
features/products/
├── services.ts        gọi route handler, nắn dữ liệu (chuỗi ISO → Date)
├── errors.ts          dịch mã HTTP thành câu người dùng đọc được
├── api/
│   ├── use-products.ts        useQuery — queryKey sinh từ URL
│   ├── use-product-writes.ts  useMutation + quy tắc vô hiệu hoá cache
│   └── use-product-stats.ts   ...
├── components/        màn hình và các mảnh của nó
├── url.ts             dựng href cho bộ lọc
└── labels.ts          chữ hiển thị cho từng trạng thái
```

| File | Trách nhiệm | Không được làm |
| --- | --- | --- |
| `services.ts` | Gọi `apiClient`, nắn dữ liệu cho màn hình | Chứa JSX, đọc session |
| `errors.ts` | Dịch `ApiError` thành câu người dùng đọc được | Gọi mạng |
| `api/use-*.ts` | `useQuery` / `useMutation`, quy tắc cache | Chứa JSX |
| `components/` | Render | Gọi `apiClient` thẳng |

Không file nào trong `features/` đọc session — việc đó thuộc về `page.tsx` và route handler.

Bảy domain hiện có: `products` · `users` · `roles` · `taxonomy` (categories và brands dùng chung) ·
`account` · `dashboard` · `auth`.

## Vì sao gom theo domain

Thêm một bộ lọc vào màn hình sản phẩm đụng tới `services.ts` (tham số gửi đi), `use-products.ts`
(queryKey), `url.ts` (href) và component — bốn file, một domain. Khi số mảnh của một domain tăng,
gom theo domain tiết kiệm hơn gom theo tầng.

CLIENT thì ngược lại: nó fetch ngay trong `page.tsx`, nên một domain chỉ còn hai mảnh (query +
component) và gom theo tầng là đủ. Xem [Cấu trúc thư mục CLIENT](./31-client-structure.md).

### Tài liệu Next.js không khuyến nghị cấu trúc nào

> "Next.js is **unopinionated** about how you organize and colocate your project files."
>
> "The simplest takeaway is to choose a strategy that works for you and your team and be
> **consistent** across the project."

Trang đó liệt kê ba chiến lược và không xếp hạng cái nào; `components` và `lib` chỉ là **tên ví
dụ**, không mang ý nghĩa gì với framework.
Nguồn: <https://nextjs.org/docs/app/getting-started/project-structure>

### Cộng đồng dùng gì

Khảo sát cây thư mục thật của bảy codebase App Router:

| Repo | Cấu trúc | Có `features/`? |
| --- | --- | --- |
| vercel/commerce | `components/{cart,product,grid}` + `lib/shopify/` | Không |
| dubinc/dub | `ui/{analytics,links,partners}` + `lib/{links,analytics}` | Không |
| shadcn-ui/taxonomy | `components/` + `lib/` | Không |
| vercel/platforms | `components/ui/` + `lib/` | Không |
| calcom/cal.com | `modules/` + `packages/features/` | Có |
| create-t3-app | `app/_components/` | Không |
| create-next-app | chỉ `app/` + `public/` | Không có ý kiến |

Gom theo tầng là mặc định an toàn — đó là lý do CLIENT dùng nó. Gom theo domain không sai, nhưng
nó chỉ trả lại giá trị khi một domain thật sự có nhiều mảnh phải sửa cùng lúc.

Feature-Sliced Design, nơi kiểu `features/` phổ biến ra, cũng viết trong tài liệu của họ:

> "make sure that the current architecture is **causing trouble** in your team… **If the current
> architecture works, maybe it's not worth changing.**"

---

## Ranh giới server và client

Số đo thật trên `apps/admin`:

| Chỉ số | Giá trị |
| --- | --- |
| Tổng file `.tsx` | 95 |
| File `.tsx` có `"use client"` | 45 |
| Trong đó là `error.tsx` (Next.js **bắt buộc**) | 6 |
| `page.tsx` là Client Component | **0 / 13** |
| Route handler | 22 |
| File `"use server"` | **0** |

### Khi nào mới cần `"use client"`

| Cần | Ví dụ trong codebase |
| --- | --- |
| `useState` / `useReducer` | `products-toolbar.tsx` giữ ô tìm kiếm |
| `useEffect` | `url-search-field.tsx` debounce |
| Event handler (`onClick`, `onChange`) | `confirm-delete-dialog.tsx` |
| Hook của React Query | mọi `features/*/api/use-*.ts` |

Không thuộc bốn nhóm trên thì để nguyên là Server Component.

### Server Component không đọc được giá trị từ module client

Lỗi này đã xảy ra thật. `NAV_ITEMS` từng nằm trong `app-shell.tsx`, một file có `"use client"`.
Layout là Server Component, import nó, và nhận về một **client reference** chứ không phải mảng:

```
TypeError: NAV_ITEMS.filter is not a function
```

Vì vậy `nav-items.ts` là module riêng, không đánh dấu client. **Quy tắc: dữ liệu mà cả server lẫn
client cùng đọc phải nằm ở module không có `"use client"`.**

### `error.tsx` bắt buộc là Client Component

Next.js yêu cầu như vậy — nó cần `onClick` cho nút thử lại. Đây là lý do 6 trong 45 file
`"use client"` của ADMIN là `error.tsx`. Không phải lựa chọn thiết kế, mà là ràng buộc framework.

```tsx
// app/(app)/products/error.tsx
"use client";

export default function ProductsError({ reset }: { reset: () => void }) {
  return <RouteErrorState onRetry={reset} />;
}
```

### Route group `(app)`

```
app/(app)/products/page.tsx   →  URL là  /products   (không có "app" trong URL)
```

Thư mục bọc trong ngoặc đơn **bị loại khỏi URL**. `(app)` tồn tại để gom mọi trang cần đăng nhập
cho chúng dùng chung một layout làm cổng kiểm tra phiên, trong khi `/login` nằm ngoài nhóm đó.

---

## Schema và type không nằm trong app

```ts
import { productFormSchema, type ProductCardDto } from "@repo/contracts";
```

| Thứ cần | Lấy từ |
| --- | --- |
| Schema, DTO, hằng số của API | `@repo/contracts` |
| `apiFetch`, `ApiError` (chỉ dùng trong route handler) | `@repo/api-client` |
| Component và helper định dạng dùng chung | `@repo/ui` |
| Phiên đăng nhập và kiểm quyền | `@repo/auth` |
| Logic chỉ ADMIN dùng | `features/<domain>/` |

Chi tiết: [Package dùng chung](./02-packages.md).

---

## Đặt tên

| Loại | Quy ước | Ví dụ |
| --- | --- | --- |
| File component | `kebab-case.tsx` | `product-card.tsx` |
| Component bên trong | `PascalCase` | `export function ProductCard()` |
| File logic | `kebab-case.ts` | `format-date.ts` |
| Hook | `use-kebab-case.ts` | `use-products.ts` |
| Thư mục route | `kebab-case` | `app/admin-users/` |

Tên file và tên component **cố ý khác nhau**: `shadcn/ui` sinh file kebab-case, và Windows không
phân biệt hoa thường trong khi Linux có — một lần đổi tên chỉ khác hoa thường có thể chạy trên máy
nhưng hỏng trên CI.

---

## Tự kiểm tra

```bash
# 1. Không có component nào trong app/ ngoài file đặc biệt của Next
find apps/admin/src/app -name "*.tsx" ! -name "page.tsx" ! -name "layout.tsx" \
  ! -name "error.tsx" ! -name "loading.tsx" ! -name "not-found.tsx"

# 2. Không có "use client" trong page.tsx
grep -rl "use client" apps/admin/src/app --include=page.tsx

# 3. Không còn server action
grep -rn "use server" apps/admin/src

# 4. Route handler chỉ uỷ quyền, không chứa quy tắc nghiệp vụ
grep -rn "prisma" apps/admin/src/app/api
```

Cả bốn lệnh đều không in ra gì nghĩa là cấu trúc còn đúng.

## Đọc tiếp

- [ADMIN làm gì](./20-admin-overview.md) — ba tầng và ranh giới server/client
- [Luồng dữ liệu ADMIN](./22-admin-data-flow.md) — từng file ở trên được gọi lúc nào
- [Thêm một màn hình](./23-admin-add-a-screen.md)
