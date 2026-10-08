# ADMIN làm gì

`apps/admin` là back office cho nhân viên, chạy ở cổng 3001. Nó là một **SPA** — sau lần tải đầu,
mọi thao tác xảy ra trong trình duyệt mà không tải lại trang — nhưng vẫn là một **BFF**.

**Sau khi đọc xong bạn sẽ:** hiểu ba tầng của app này, biết code nào chạy ở server và code nào
chạy ở trình duyệt, và vì sao hai điều đó không mâu thuẫn nhau.

## Trước khi bắt đầu

- Biết React cơ bản: component, props, `useState`
- Nên đọc [Kiến trúc](./00-architecture.md) để biết ba service chia việc thế nào
- **Không** cần biết Next.js, App Router hay React Query từ trước

> **"Server" ở đây là gì?** Có **hai** server. Một là **NestJS API** (cổng 3002) — nơi giữ quy tắc
> nghiệp vụ và nói chuyện với database. Hai là **server của Next.js** (cổng 3001) — nơi chạy phần
> code React không gửi xuống trình duyệt. Chúng là hai tiến trình khác nhau, và phân biệt được hai
> cái này là nửa phần khó của Next.js.

---

## Ba tầng

```
┌──────────────────────────────────────────────┐
│  TRÌNH DUYỆT                                 │
│  React chạy ở đây · giữ cache của React Query│
│  KHÔNG có token · KHÔNG biết URL của API     │
└───────────────────┬──────────────────────────┘
                    │  fetch("/api/products?status=PUBLISHED")
                    │  cùng origin → cookie httpOnly tự đi kèm
                    ▼
┌──────────────────────────────────────────────┐
│  SERVER CỦA NEXT.JS  :3001                   │
│  page.tsx (Server Component) · route handler │
│  Đọc được cookie → lấy ra access token       │
└───────────────────┬──────────────────────────┘
                    │  GET /products?status=PUBLISHED
                    │  Authorization: Bearer <token>
                    ▼
┌──────────────────────────────────────────────┐
│  NESTJS API  :3002  ──▶  PostgreSQL          │
│  Nơi DUY NHẤT quyết định ai được làm gì      │
└──────────────────────────────────────────────┘
```

Ba điều cần nhớ:

1. **Trình duyệt chỉ nói chuyện với server Next.** Nó gọi `/api/...` — một đường dẫn tương đối,
   cùng origin. Không có CORS, không có URL của NestJS trong bundle.
2. **Token không bao giờ xuống tới JavaScript.** Nó nằm trong cookie `httpOnly`, mà `httpOnly`
   nghĩa là `document.cookie` không đọc được.
3. **Server Next không quyết định quyền.** Nó chỉ chuyển tiếp. NestJS mới là nơi kiểm.

ADMIN có **22 route handler** trong `app/api/` — đó là toàn bộ bề mặt mà trình duyệt chạm tới.

---

## Vì sao là SPA

| | Nếu server-first | ADMIN hôm nay (SPA) |
| --- | --- | --- |
| Đổi một bộ lọc | Một vòng request tới server Next, render lại cả trang | Một fetch, cache cũ hiện ngay |
| Quay lại bộ lọc vừa xem | Request lại | Lấy từ cache, không có request |
| SEO | Cần | Không cần — trang nội bộ, phải đăng nhập |
| Dữ liệu sau khi ghi | `revalidatePath` | `invalidateQueries` theo tiền tố |

Back office là công cụ: người dùng lọc, sửa, lọc tiếp, hàng chục lần trong một phiên. Mỗi lần đổi
bộ lọc mà phải chờ server render lại thì cảm giác chậm hẳn. Storefront thì ngược lại — nó cần SEO
và cần lần tải đầu nhanh, nên nó chọn server-first. Xem [CLIENT](./30-client-overview.md).

### SPA nhưng vẫn là BFF

Hai khái niệm này không loại trừ nhau: SPA nói về _chỗ render_, BFF nói về _chỗ giữ bí mật_.

| Nếu trình duyệt gọi thẳng API | Với BFF |
| --- | --- |
| Token phải nằm trong `localStorage` hoặc cookie đọc được → một lỗi XSS là mất token | Token ở `httpOnly`, XSS không lấy được |
| Phải bật CORS trên API cho từng origin | Cùng origin, không cần CORS |
| URL và hình dạng của API lộ trong bundle | Trình duyệt chỉ thấy `/api/...` |
| Đổi API là đổi code đã deploy xuống máy người dùng | Đổi API chỉ đụng tầng route handler |

---

## Server Component và Client Component

**Mặc định, mọi component là Server Component.** Nó chạy trên server Next, và **chỉ kết quả HTML**
được gửi đi — code của nó không bao giờ xuống trình duyệt.

Thêm `"use client"` ở dòng đầu file thì component đó trở thành **Client Component**: code của nó
được đóng gói gửi xuống trình duyệt và chạy ở đó.

| | Server Component | Client Component |
| --- | --- | --- |
| Đánh dấu | (mặc định) | `"use client"` ở dòng đầu |
| `useState`, `useEffect`, `onClick` | ❌ | ✅ |
| Đọc được secret, cookie, session | ✅ | ❌ |
| Code có gửi xuống trình duyệt | Không | Có |
| Hook của React Query | ❌ | ✅ |

> **`"use client"` áp cho cả cây bên dưới.** Một component client import component khác thì
> component đó cũng thành client. Vì vậy nó được đặt càng thấp càng tốt — ở "lá", không ở gốc.

### Page vẫn là Server Component

ADMIN là SPA, nhưng **0 trên 13 `page.tsx` là Client Component**. Mỗi page làm đúng hai việc rồi
dừng lại:

```tsx
// apps/admin/src/app/(app)/products/page.tsx — Server Component
import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { ProductsScreen } from "@/features/products/components/products-screen";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const session = await auth();
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
```

Hai việc đó là **đọc session** và **quyết định ai thấy màn hình nào**. Cả hai đều cần chạy trên
server — session nằm trong cookie `httpOnly`.

Lần kiểm quyền này **không phải** ranh giới bảo mật. NestJS đã kiểm ở mọi request rồi. Nó ở đây để
không gửi code của màn hình cho người không mở được, và để không nháy giao diện rồi mới ẩn.

`ProductsScreen` có `"use client"` — từ đó trở xuống là SPA thật sự: đổi bộ lọc, phân trang, mở
dialog, tất cả xảy ra trong trình duyệt.

---

## Cookie: thứ làm cho BFF chạy được

Khi đăng nhập thành công, server Next đặt một cookie phiên có cờ `httpOnly`:

```js
// Gõ trong DevTools Console sau khi đã đăng nhập:
document.cookie;
// → ""    (chuỗi rỗng — JavaScript không thấy cookie phiên)
```

Nhưng mọi request tới cùng origin vẫn tự động mang cookie theo. Đó là lý do `api-client.ts` cấu
hình đúng hai dòng quan trọng:

```ts
// apps/admin/src/services/api-client.ts
export const apiClient = axios.create({
  baseURL: "/api", // đường dẫn tương đối → cùng origin
  withCredentials: true, // cho phép gửi cookie
  timeout: TIMEOUT_MS,
});
```

`baseURL` là một **đường dẫn**, không phải một origin. Đổi nó thành `http://localhost:3002` là
toàn bộ mô hình sụp: cần CORS, và cookie không còn tự đi kèm.

---

## ADMIN không dùng server action

Server action (`"use server"`) là cách ghi dữ liệu của Next.js khi app render phía server. ADMIN
**không có file nào** như vậy:

```bash
grep -rn "use server" apps/admin/src    # không in ra gì
```

Lý do: một file `"use server"` biến **mọi export** của nó thành một endpoint POST mà trình duyệt
gọi được trực tiếp — tức là thêm một bề mặt nữa song song với route handler. Có sẵn 22 route
handler rồi thì hai con đường ghi dữ liệu chỉ là hai nơi phải kiểm tra khi có sự cố.

CLIENT vẫn dùng server action, vì nó server-first và không có tầng route handler.

---

## Bạn đã học được gì

- ADMIN là SPA về chỗ render, và là BFF về chỗ giữ token — hai chuyện khác nhau
- Trình duyệt chỉ gọi `/api/...` của chính app; route handler mới đổi cookie lấy token
- Mặc định là Server Component; `"use client"` đặt ở lá và áp cho cả cây bên dưới
- Mọi `page.tsx` vẫn là Server Component, vì nó đọc session và kiểm quyền
- Kiểm quyền ở page là để tiết kiệm bundle, không phải ranh giới bảo mật
- Không có server action trong ADMIN

## Đọc tiếp

- [Cấu trúc thư mục ADMIN](./21-admin-structure.md) — file mới đặt ở đâu
- [Luồng dữ liệu ADMIN](./22-admin-data-flow.md) — đi theo một thao tác từ đầu tới cuối
- [CLIENT làm gì](./30-client-overview.md) — app còn lại chọn ngược lại, và vì sao
