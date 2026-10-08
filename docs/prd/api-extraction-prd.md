# PRD — Tách tầng backend ra NestJS API

## Problem Statement

Hai app Next.js (`admin`, `client`) đang gọi Prisma trực tiếp. Hệ quả đo được trong code hiện tại:

- **Logic nghiệp vụ bị nhân đôi.** `changeOwnPassword` tồn tại hai bản gần như giống hệt ở hai app
  — cùng bcrypt verify, cùng liveness check, cùng update. Đổi chính sách mật khẩu phải sửa hai nơi.
- **Quy tắc quan trọng nhất hệ thống chỉ nằm ở một app.** Bộ lọc `PUBLISHED_ONLY` sống trong tầng
  catalog của `client`. Database không enforce nó và không có row-level security. Bất kỳ consumer
  nào quên là lộ sản phẩm chưa phát hành.
- **Mỗi instance Next giữ một connection pool riêng.** Scale lên N instance là N pool đập vào một
  Postgres.
- **Không có contract** cho consumer thứ ba (mobile, partner, cron job).

Lưu ý quan trọng về phạm vi: **đây không phải vấn đề bảo mật.** Server Component chạy trên server;
Prisma client không bao giờ xuống browser. Động cơ của thay đổi này là *trùng lặp logic và thiếu
contract*, không phải lộ dữ liệu.

## Business Context

Nền tảng e-commerce hai mặt: back office quản lý catalog + RBAC, và storefront cho khách hàng.
Thay đổi này phục vụ **tiến hoá kiến trúc và mục tiêu học tập**, không thêm giá trị nghiệp vụ mới
nào cho người dùng cuối. Thành công được đo bằng việc *không ai nhận ra gì thay đổi*.

## Systems Involved

**Hiện tại**

```
Browser ──► Next admin :3001 ──► Prisma ──► Postgres 16
Browser ──► Next client :3000 ──► Prisma ──┘
            Auth.js v5 (JWT trong cookie httpOnly)
```

**Đích**

```
Browser ──cookie httpOnly──► Next BFF (:3001 / :3000)
                                 │ Authorization: Bearer <JWT>
                                 ▼
                            NestJS API :3002 ──► Prisma ──► Postgres 16
                                 │
                            /api/docs  (Swagger UI)
```

Không có hệ thống ngoài nào tham gia. Stripe và các tích hợp khác chưa được xây.

## Solution

Chèn một NestJS API vào giữa hai app và database. Hai app Next trở thành **BFF đúng nghĩa**: giữ
session, nắn dữ liệu theo UI của mình, gọi API qua HTTP nội bộ.

Năm quy tắc BFF, và trạng thái hiện tại:

| #   | Quy tắc                                               | Trước | Sau |
| --- | ----------------------------------------------------- | ----- | --- |
| 1   | Browser không giữ token, chỉ cookie `httpOnly`        | ✅    | ✅  |
| 2   | BFF gọi API, không phải browser                       | ✅    | ✅  |
| 3   | Mỗi frontend một BFF riêng, được nắn dữ liệu khác nhau | ✅    | ✅  |
| 4   | Session là việc của BFF; API stateless                | ✅    | ✅  |
| 5   | Core API generic; BFF mới là thứ chuyên biệt          | ❌    | ✅  |

Nói cách khác: BFF đã tồn tại và đã đúng. Việc cần làm là **thêm core API phía sau nó**.

## User Stories

> 1. As a **developer**, I want business rules to live in exactly one place, so that a rule like
>    "only PUBLISHED products are visible" cannot be forgotten by a future consumer.

**Given** storefront và một consumer mới cùng hỏi danh sách sản phẩm,
**When** cả hai gọi `GET /products` mà không có quyền `product:read`,
**Then** API chỉ trả về sản phẩm PUBLISHED cho cả hai, bất kể bên gọi có nhớ lọc hay không.

> 2. As a **developer**, I want a Swagger UI, so that I can see and try every endpoint without
>    reading source code.

**Given** API đang chạy, **When** mở `/api/docs`, **Then** thấy đủ mọi endpoint kèm shape của
request/response, và gọi thử được ngay trên trang.

> 3. As the **system**, I want the API to re-check permissions on every request, so that a buggy or
>    compromised BFF cannot grant access it should not have.

**Given** một token hợp lệ nhưng thiếu `product:delete`,
**When** gọi `DELETE /products/:id`, **Then** API trả 403 kể cả khi BFF đã hiện nút xoá.

> 4. As a **developer**, I want to migrate one domain at a time, so that both apps keep working
>    throughout the migration.

**Given** domain `products` đã chuyển sang API còn `users` thì chưa,
**When** chạy cả hai app, **Then** mọi màn hình vẫn hoạt động — products qua API, users qua Prisma.

> 5. As a **customer**, I want the storefront to behave exactly as before, so that the migration is
>    invisible to me.

**Given** bất kỳ trang storefront nào, **When** so sánh trước và sau migration,
**Then** nội dung, URL, status code và thông báo lỗi giống hệt nhau.

> 6. As a **staff user**, I want the admin app to behave exactly as before.

**Given** bất kỳ màn hình admin nào, **When** thực hiện CRUD hoặc đổi quyền,
**Then** kết quả và thông báo lỗi giống hệt trước migration.

> 7. As the **system**, I want DRAFT and ARCHIVED products to be invisible to the storefront,
>    enforced at the API.

**Given** một sản phẩm DRAFT, **When** storefront gọi bất kỳ endpoint catalog nào,
**Then** sản phẩm đó không xuất hiện ở list, detail, search hay sitemap; detail trả 404.

> 8. As a **developer**, I want a single database connection pool.

**Given** N instance của mỗi app Next, **When** hệ thống chạy,
**Then** chỉ API giữ Prisma pool; hai app không mở kết nối nào tới Postgres.

> 9. As a **developer**, I want validation defined once and enforced on both tiers.

**Given** một schema trong `@repo/contracts`, **When** BFF và API cùng validate,
**Then** cả hai dùng chung định nghĩa đó; BFF validate để phản hồi tức thì, API validate vì nó là
trust boundary.

> 10. As the **system**, I want an expired token to return 401, so the BFF can send the user to
>     sign in again.

**Given** access token đã hết hạn, **When** BFF gọi bất kỳ endpoint nào,
**Then** API trả 401 và BFF chuyển hướng tới `/login?next=<trang hiện tại>`.

> 11. As a **customer**, I want a clear message when the shop is unavailable, not a crash.

**Given** API không phản hồi, **When** mở một trang storefront,
**Then** thấy trạng thái lỗi có nút thử lại, không phải trang trắng hay stack trace.

### Validation Rules

Schema giữ nguyên quy tắc hiện có, chỉ đổi nơi cư trú sang `@repo/contracts`.

| Field                         | Rule                                     | Error Message                                                        | Severity |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------- | -------- |
| `product.name`                | 1–160 ký tự                              | Product name is required.                                            | Error    |
| `product.slug`                | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique       | Lowercase letters, numbers and single hyphens only. / Slug taken.    | Error    |
| `product.price`               | ≥ 0, định dạng tiền                      | Enter an amount like 159 or 159.00.                                  | Error    |
| `product.compareAtPrice`      | rỗng hoặc > `price`                      | Compare-at price must be higher than the price.                      | Error    |
| `product.stock`               | số nguyên 0–9 999 999                    | Enter a whole number of units.                                       | Error    |
| `product.status`              | `DRAFT` / `PUBLISHED` / `ARCHIVED`       | —                                                                    | Error    |
| `user.email`                  | email, ≤ 254, lowercase, unique          | Enter a valid email address. / An account with that email exists.    | Error    |
| `password`                    | ≥ 8, ≤ 200 ký tự                         | Use at least 8 characters.                                           | Error    |
| `changePassword.newPassword`  | khác `currentPassword`                   | Choose a password you aren't already using.                          | Error    |
| `confirmPassword`             | khớp password                            | The two passwords don't match.                                       | Error    |
| `role.name`                   | 1–60, unique                             | That role name is already taken.                                     | Error    |
| `role.permissions[]`          | thuộc catalog cố định                    | Unknown permission.                                                  | Error    |
| `taxonomy.slug`               | như product slug, unique trong bảng      | That slug is already taken.                                          | Error    |
| Mọi `listParams`              | sai định dạng → về mặc định              | — (không báo lỗi)                                                    | Info     |

Quy tắc cuối quan trọng: tham số danh sách trên URL dùng `.catch()` và **không bao giờ** làm hỏng
trang. Hành vi này đã có và phải giữ nguyên.

### Edge Cases & Negative Scenarios

| Tình huống                                 | Hành vi mong đợi                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| API không phản hồi / timeout               | BFF hiện trạng thái lỗi có nút thử lại. Không lộ chi tiết kỹ thuật                                 |
| Token hết hạn giữa phiên                   | 401 → BFF chuyển hướng tới `/login?next=…`                                                         |
| Token hợp lệ, thiếu quyền                  | 403 → BFF hiện trạng thái Forbidden                                                                |
| Tài khoản bị vô hiệu sau khi đăng nhập     | API kiểm tra `is_active` ở mỗi request, trả 401. JWT đã phát không thể tự biết điều này             |
| Quyền bị gỡ sau khi đăng nhập              | Permission đóng dấu lúc đăng nhập (hành vi hiện tại). API vẫn kiểm lại từ DB để tránh leo thang     |
| Slug / email trùng                         | 409 kèm `errors.{field}` → BFF hiện lỗi ngay dưới ô nhập                                            |
| Ghi nhiều bước (gán role, đổi permission)  | Transaction nằm **trong** service của API. BFF gọi một endpoint — không có partial write            |
| `bigint` của Postgres                      | API trả id dạng **string** trong JSON. Trùng với thứ BFF đang nhận hôm nay                          |
| Trang vượt quá số trang thật               | Clamp về trang cuối (hành vi hiện tại)                                                             |
| Tham số URL hỏng / thù địch                | Về mặc định, không throw                                                                           |
| Migrate dở dang                            | Mỗi phase để lại hệ thống chạy được; domain chưa chuyển vẫn dùng Prisma                            |
| Storefront gọi `?status=DRAFT`             | Bị bỏ qua trừ khi token có `product:read`                                                          |

## Implementation Decisions

### Modules

| Module                     | Interface                                             | Boundary                                                                        |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/api` (NestJS)        | REST trên :3002, Swagger tại `/api/docs`              | Sở hữu mọi quy tắc nghiệp vụ và **là nơi duy nhất** giữ Prisma pool              |
| `packages/contracts`       | 13 Zod schema + catalog permission + type suy ra      | Từ vựng chung. Không chứa logic, không phụ thuộc runtime                         |
| `packages/api-client`      | `apiFetch<T>(path, opts)`                             | Gắn Bearer token, map HTTP lỗi → `ApiError`, timeout. Không biết resource cụ thể |
| `packages/auth` (còn lại)  | Cấu hình Auth.js, `requirePermission`                 | Chỉ còn việc của BFF: cookie, session, callback                                 |
| `apps/*/src/lib/*`         | Giữ nguyên tên hàm và chữ ký                          | Đổi ruột: Prisma → `apiFetch`. Phần map sang shape UI **không đổi**              |

Nguyên tắc phân loại áp dụng cho mọi file khi migrate:

- Liên quan đến browser (cookie, redirect, session, form state) → **BFF**
- Liên quan đến dữ liệu và quy tắc nghiệp vụ (bcrypt, quyền, lọc trạng thái) → **API**
- Từ vựng hai bên cùng nói (permission catalog, kiểu dữ liệu) → **package chung**

### API Contract

Resource generic. Những truy vấn chuyên biệt của storefront (`listLatestProducts`,
`listCategoryEntries`, `listFilterOptions`, `listSitemapProducts`) **không** thành endpoint riêng —
chúng là tổ hợp của các endpoint dưới đây do BFF ghép lại. Đó chính là quy tắc 5.

| Method                | Path                                      | Quyền                             | Ghi chú                                      |
| --------------------- | ----------------------------------------- | --------------------------------- | -------------------------------------------- |
| POST                  | `/auth/login`                             | công khai                         | Trả user + permissions + accessToken         |
| POST                  | `/auth/register`                          | công khai                         | Tạo customer, không role                     |
| GET                   | `/auth/me`                                | đã đăng nhập                      | Thay `isUserActive`; 401 nếu bị vô hiệu      |
| POST                  | `/auth/change-password`                   | đã đăng nhập                      | Id lấy từ token, không từ body               |
| GET                   | `/products`                               | —                                 | Mặc định PUBLISHED. Lọc status cần `product:read` |
| GET                   | `/products/:id`                           | `product:read`                    | Dạng dành cho form sửa                       |
| GET                   | `/products/by-slug/:slug`                 | —                                 | PUBLISHED-only trừ khi có `product:read`     |
| GET                   | `/products/stats`                         | `product:read`                    | Đếm theo trạng thái                          |
| POST                  | `/products`                               | `product:create`                  |                                              |
| PATCH                 | `/products/:id`                           | `product:update`                  |                                              |
| PATCH                 | `/products/:id/status`                    | `product:update`                  |                                              |
| DELETE                | `/products/:id`                           | `product:delete`                  |                                              |
| GET                   | `/categories` · `/brands`                 | —                                 | Hỗ trợ `?hasPublished=true` cho storefront   |
| POST · PATCH · DELETE | `/categories/:id` · `/brands/:id`         | `category:manage` · `brand:manage` |                                             |
| GET                   | `/users` · `/users/:id`                   | `user:manage`                     |                                              |
| POST                  | `/users`                                  | `user:manage`                     |                                              |
| PATCH                 | `/users/:id` · `/:id/status` · `/:id/roles` | `user:manage`                   |                                              |
| GET                   | `/roles` · `/roles/:id`                   | `role:manage`                     |                                              |
| POST · PATCH · DELETE | `/roles` · `/roles/:id`                   | `role:manage`                     |                                              |
| PATCH                 | `/roles/:id/permissions`                  | `role:manage`                     |                                              |
| GET                   | `/permissions`                            | `role:manage`                     | Catalog cố định                              |

**Quyết định bảo mật then chốt:** `GET /products` mặc định chỉ trả PUBLISHED. Muốn thấy DRAFT hay
ARCHIVED phải có `product:read`. Nhờ vậy quy tắc "khách không bao giờ thấy hàng nháp" được enforce
tại **một chỗ duy nhất**, thay vì phụ thuộc vào việc mỗi consumer nhớ truyền bộ lọc.

### Authentication

Biến thể **token relay** của BFF, ở dạng tối giản:

1. Form đăng nhập → server action → `authorize()` của Auth.js
2. `authorize()` gọi `POST /auth/login`
3. API verify bcrypt → trả `{ id, email, name, permissions, accessToken }`
4. Callback `jwt` của Auth.js cất `accessToken` vào session cookie
5. Mọi lời gọi BFF → API gửi `Authorization: Bearer <accessToken>`
6. API: `JwtAuthGuard` xác thực chữ ký → `PermissionsGuard` kiểm `@Permissions()`

Browser **không bao giờ** thấy `accessToken` — nó nằm trong cookie `httpOnly` do server Next giữ.
Đây là thuộc tính định nghĩa nên BFF và nó phải được giữ.

### Error Contract

| Tầng | Trách nhiệm                            | Hình dạng                                     |
| ---- | -------------------------------------- | --------------------------------------------- |
| API  | Trust boundary. Validate vì đúng/sai   | HTTP chuẩn + `{ statusCode, message, errors? }` |
| BFF  | Trải nghiệm. Validate để phản hồi ngay | Dịch sang `ActionResult` hiện có              |

Ánh xạ: `400/409 → { ok:false, error, fieldErrors }` · `401 → redirect tới login` ·
`403 → trạng thái Forbidden` · `5xx → thông báo chung, không lộ chi tiết`.

`ActionResult` **ở lại BFF**. Nó là hợp đồng của form, không phải của API.

### Những thứ chủ động không làm

| Bỏ qua                             | Lý do                                                                |
| ---------------------------------- | -------------------------------------------------------------------- |
| OAuth Authorization Code flow, PKCE | Cần khi có bên thứ ba. BFF và API cùng một chủ                       |
| Refresh token                      | Token nằm trong cookie `httpOnly` server giữ, browser không chạm tới |
| RFC 7807 Problem Details           | Chuẩn cho API công khai nhiều bên tiêu thụ                           |
| Sinh client từ OpenAPI             | Monorepo đã có type từ Zod; codegen thêm build step, code không đọc được |
| Validate response bằng Zod lúc chạy | Hai tầng cùng repo, cùng `@repo/contracts`                          |
| SWR / React Query                  | Dữ liệu vẫn fetch ở Server Component                                 |
| Repository pattern trên Prisma     | Prisma **đã là** tầng truy cập dữ liệu                               |

## Downstream Impact

| Bị ảnh hưởng                           | Mức độ                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/admin/src/lib/**`                | 34 hàm đổi ruột; tên và chữ ký giữ nguyên                                            |
| `apps/client/src/lib/**`               | 14 hàm đổi ruột                                                                       |
| `packages/auth`                        | Tách ba. `user.ts` rời sang API                                                       |
| `packages/db`                          | Chỉ còn API phụ thuộc. Hai app bỏ `@repo/db`                                          |
| 420 unit/component test                | **Phải tiếp tục xanh.** Test schema và component không đổi; test gọi dữ liệu mock `apiFetch` |
| Deployment                             | 2 service → 3. Thêm `API_URL`, `JWT_SECRET`                                           |
| Chạy local                             | Thêm một tiến trình. `pnpm dev` phải khởi động cả ba                                  |
| README (gốc + 2 app)                   | Sơ đồ kiến trúc, bảng lệnh, biến môi trường                                           |
| `docs/` | PRD và plan trước đó đã mất (chưa từng commit vì `.gitignore`); `docs/*` nay đã được gỡ khỏi ignore |
| Prisma connection pool                 | Từ 2×N xuống 1×M                                                                      |

**Không** có breaking change nào với người dùng cuối: không đổi URL, không đổi shape dữ liệu hiển
thị, không đổi thông báo lỗi.

## Out of Scope

- Bất kỳ tính năng mới nào. Đây thuần tuý là di chuyển code.
- Giỏ hàng, đơn hàng, thanh toán — chưa từng tồn tại.
- Mobile app hay consumer thứ ba. API thiết kế để sẵn sàng, nhưng không xây.
- Full-text search. Vẫn là `LIKE` như hiện tại.
- Content Security Policy. Vẫn là khoảng trống đã biết.
- Dựng lại e2e suite đã xoá.
- Rate limiting, API versioning, observability/tracing.
- Thu hẹp `images.remotePatterns` — vẫn là việc phải làm trước khi deploy công khai.
- Tách repo. API ở lại trong monorepo này.

## Further Notes

**Rủi ro lớn nhất là latency.** Hiện `prisma.products.findMany()` trong Server Component mất
~1–5 ms in-process. Qua API thành: serialize → HTTP → deserialize → query → serialize → HTTP →
deserialize. Thực tế thêm 10–50 ms mỗi request, nhiều hơn nếu không co-located. Cần đo trước và
sau trên trang chủ và trang listing, rồi chấp nhận con số đó một cách có ý thức.

**Một thứ được thêm:** `fetch` của Next nhận `next: { revalidate, tags }`. Hiện ISR chỉ đặt được ở
mức page; sau khi chuyển sang fetch sẽ đặt được cache theo từng resource. Invalidation xuyên app
(admin sửa → storefront làm mới ngay) vẫn cần webhook, nhưng lần đầu tiên nó khả thi.

**Câu hỏi còn mở**

1. API deploy ở đâu? Vercel chạy được NestJS nhưng không phải nơi tự nhiên nhất. Nếu khác vùng với
   Next thì latency sẽ tệ hơn con số ước lượng ở trên.
2. Hai app có dùng chung `JWT_SECRET` với API không, hay API ký bằng khoá riêng?
   Khuyến nghị: **khoá riêng cho API**, tách biệt khỏi `AUTH_SECRET` của Auth.js.
3. Dọn comment thành một pass riêng trước khi migrate, hay dọn kèm từng file khi chạm vào?
   Khuyến nghị: **dọn kèm**, để diff refactor không lẫn với diff comment.
