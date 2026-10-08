# Kiến trúc

Hệ thống gồm ba project chạy độc lập, cùng nằm trong một monorepo Turborepo.

| Project    | Thư mục       | Cổng | Vai trò                                      |
| ---------- | ------------- | ---- | -------------------------------------------- |
| **API**    | `apps/api`    | 3002 | NestJS. Sở hữu quy tắc nghiệp vụ và database |
| **ADMIN**  | `apps/admin`  | 3001 | Next.js. Back office cho nhân viên           |
| **CLIENT** | `apps/client` | 3000 | Next.js. Storefront cho khách hàng           |

## Luồng dữ liệu

```
Trình duyệt
    │  cookie httpOnly (session)
    ▼
ADMIN / CLIENT  ─────────── đây là tầng BFF
    │  Authorization: Bearer <JWT>
    ▼
API  ─────────── nơi duy nhất mở kết nối Prisma
    │
    ▼
PostgreSQL
```

Trình duyệt **không bao giờ** gọi API trực tiếp. Lời gọi tới API luôn xuất phát từ phía server của
ADMIN hoặc CLIENT, vì chỉ ở đó mới đọc được cookie `httpOnly` chứa token.

## BFF là gì

BFF viết tắt của _Backend For Frontend_: một backend riêng cho từng loại giao diện, nhiệm vụ là
**nắn dữ liệu cho đúng màn hình đó** — không phải sở hữu quy tắc nghiệp vụ.

Trong hệ thống này, phần server của ADMIN và CLIENT chính là hai BFF. Chúng viết bằng Next.js
nhưng chạy trên Node ở phía server, nên về bản chất chúng là backend.

Điều quan trọng nhất của BFF: **token không bao giờ xuống trình duyệt.** Trình duyệt chỉ giữ một
cookie `httpOnly` mà JavaScript không đọc được. Token gọi API nằm bên trong cookie đó, do server
Next giữ. Đây là lý do pattern này được khuyến nghị — không phải vì nó gọi API hộ frontend.

## Hai mô hình render

Hai app Next.js render theo hai cách khác nhau, vì chúng phục vụ hai việc khác nhau.

| | **ADMIN** | **CLIENT** |
| --- | --- | --- |
| Mô hình | SPA — dữ liệu lấy ở trình duyệt | Server-first — dữ liệu lấy khi render |
| Ai gọi API | Route handler trong `app/api/` | Server Component và server action |
| Trình duyệt gọi gì | `/api/...` của chính app, qua React Query | Không gọi gì — nhận HTML đã render |
| Thư viện dữ liệu | TanStack Query | `fetch` của Next (cache + ISR) |
| Cấu trúc thư mục | `features/<domain>/` | `components/` + `lib/` |
| SEO | Không cần | Là yêu cầu |
| Vì sao | Công cụ nội bộ, nhiều thao tác lọc và sửa liên tiếp | Trang công khai, lần tải đầu và chỉ mục tìm kiếm quyết định doanh thu |

Điểm dễ hiểu nhầm: **ADMIN là SPA nhưng vẫn là BFF.** Hai khái niệm này không loại trừ nhau — SPA
nói về _chỗ render_, BFF nói về _chỗ giữ bí mật_. Trình duyệt của ADMIN gọi route handler cùng
origin, và chính route handler mới đổi cookie lấy token.

Chi tiết từng app: [ADMIN](./20-admin-overview.md) · [CLIENT](./30-client-overview.md).

### Cùng một endpoint, hai hình dạng

API phơi ra endpoint generic. Mỗi BFF ghép lại theo nhu cầu màn hình của mình:

```
API:      GET /products?sort=newest        →  { items, total, page, pageCount }

CLIENT:   trang chủ cần { hero, categories, latest[8] }
          → gọi /products + /categories rồi ghép lại

ADMIN:    bảng quản trị cần { rows, total, page, pageCount } kèm cả DRAFT
          → gọi cùng endpoint đó, nắn kiểu khác
```

Vì vậy bạn sẽ thấy hàm lấy danh sách sản phẩm tồn tại ở cả hai app với nội dung khác nhau —
`listProducts` trong `apps/client/src/lib/catalog/queries.ts` và `fetchProducts` trong
`apps/admin/src/features/products/services.ts`. Đó là chủ ý, không phải trùng lặp.

## Quy tắc phân chia code

Khi không chắc một đoạn code thuộc về đâu, hỏi ba câu theo thứ tự:

| Câu hỏi                                                       | Thuộc về                              |
| ------------------------------------------------------------- | ------------------------------------- |
| Nó động đến cookie, redirect, session, trạng thái form không?  | **BFF** (`apps/admin`, `apps/client`) |
| Nó là quy tắc nghiệp vụ — bcrypt, phân quyền, lọc trạng thái?  | **API** (`apps/api`)                  |
| Nó là từ vựng cả hai bên cùng dùng — schema, kiểu dữ liệu?     | **`packages/contracts`**              |

Năm package dùng chung được mô tả ở [Package dùng chung](./02-packages.md).

Prisma **không** nằm trong `packages/`. Schema ở `apps/api/prisma/schema.prisma`, `PrismaService`
ở `apps/api/src/prisma/`. Đặt nó thành package dùng chung sẽ ngụ ý rằng ai cũng dùng được, trong
khi API là nơi duy nhất được mở kết nối database.

## Quy tắc không được phá

**Chỉ sản phẩm PUBLISHED mới ra tới khách hàng.** Quy tắc này được enforce **trong API**, không
phải ở bên gọi:

```ts
// apps/api/src/products/products.service.ts
const PUBLISHED_ONLY = { status: "PUBLISHED" } satisfies Prisma.productsWhereInput;
```

`GET /products?status=DRAFT` bị bỏ qua. Không consumer nào — kể cả một app mới viết sau này — có
thể quên bộ lọc đó, vì nó không nằm ở phía họ.

## Vì sao có thêm một hop mạng

Trước đây hai app gọi thẳng Prisma. Đặt API vào giữa đổi lấy:

**Được:**

- Quy tắc nghiệp vụ nằm một chỗ. Một chính sách mật khẩu, một bộ lọc trạng thái
- Một connection pool duy nhất tới Postgres, thay vì mỗi instance Next một pool
- Có contract thật cho consumer tương lai (mobile, partner)

**Mất:**

- Mỗi lần đọc dữ liệu thêm một vòng HTTP (số đo cụ thể ở dưới)
- Transaction phải nằm gọn trong một endpoint của API. Không ghép nhiều lời gọi API thành một
  thao tác logic được
- Thêm một tiến trình phải chạy khi phát triển
- Build của CLIENT cần API đang chạy, vì `generateStaticParams` và các trang ISR đọc dữ liệu
  ngay lúc build

### Hop đó tốn bao nhiêu

Đo trên máy local, cả hai project chạy ở chế độ production (`next start`, `node dist/main`),
Postgres cùng máy. Mỗi con số là trung vị của 12 request sau 3 request làm nóng:

| Đo cái gì                                             | Trung vị |
| ----------------------------------------------------- | -------- |
| Hai truy vấn Prisma (`count` + `findMany`) in-process  | 3.2 ms   |
| `GET /products` qua HTTP                              | 7.4 ms   |
| `GET /categories` qua HTTP                            | 5.2 ms   |
| Trang `/products` của CLIENT (render + 1 lời gọi API) | 19.1 ms  |
| Trang `/products` có filter                           | 13.7 ms  |
| Trang chủ CLIENT (đang nằm trong ISR cache)           | 4.5 ms   |

Dòng đầu là chi phí chạm database thuần túy — đúng phần việc mà trước kia Next tự làm. Chênh
lệch giữa nó và `GET /products` là cái giá của việc tách API: **khoảng 4 ms** cho HTTP, routing
của Nest và serialize JSON.

Trang chủ nhanh hơn cả endpoint API vì nó được ISR cache (`revalidate = 60`): phần lớn request
không chạm API. Đổi lại, trang listing phụ thuộc `searchParams` nên luôn render động và luôn
tốn một lời gọi API.

Không có số "trước khi tách" để đối chiếu trực tiếp, vì phiên bản gọi Prisma thẳng từ Next chưa
từng được commit. Dòng Prisma in-process là phép đo thay thế gần nhất: cùng truy vấn, cùng
database, chỉ khác là không đi qua mạng.

## Đọc tiếp

- [Chạy hệ thống trên máy local](./01-getting-started.md)
- [Package dùng chung](./02-packages.md)
- [API làm gì](./10-api-overview.md) · [ADMIN làm gì](./20-admin-overview.md) ·
  [CLIENT làm gì](./30-client-overview.md)
