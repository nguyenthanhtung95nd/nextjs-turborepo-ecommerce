# Implementation Plan: Tách tầng backend ra NestJS API

> Source PRD: [api-extraction-prd.md](../prd/api-extraction-prd.md)
>
> Thay thế plan trước đó, vốn mô tả kiến trúc hai app Next gọi Prisma trực tiếp.

## Architectural Decisions

Những quyết định cố định, áp dụng cho mọi phase:

- **Stack:** NestJS 11 (API, :3002) · Next.js 16 App Router (ADMIN :3001, CLIENT :3000) ·
  Prisma 6 · Postgres 16 · Turborepo + pnpm workspaces
- **Ranh giới:** Browser ↔ BFF qua cookie `httpOnly`. BFF ↔ API qua `Authorization: Bearer`.
  Browser **không bao giờ** gọi API trực tiếp
- **Phân loại code:** việc của browser (cookie, redirect, form state) → BFF · quy tắc nghiệp vụ
  (bcrypt, quyền, lọc trạng thái) → API · từ vựng chung (permission catalog, Zod schema) →
  `packages/contracts`
- **Package mới:** `packages/contracts` (schema + type) · `packages/api-client` (`apiFetch`)
- **Auth:** API phát JWT riêng (khoá riêng, không dùng `AUTH_SECRET`). `JwtAuthGuard` +
  `@Permissions()` + `PermissionsGuard`. Không refresh token
- **Lỗi:** API trả HTTP chuẩn + `{ statusCode, message, errors? }`. BFF dịch sang `ActionResult`
- **Id:** `bigint` của Postgres serialize thành **string** trong JSON
- **Nest pattern:** mỗi resource đúng 3 file — `*.controller.ts`, `*.service.ts`, `*.module.ts`.
  Không repository trên Prisma, không CQRS, không custom decorator ngoài `@Permissions()`

### Tiêu chí cố định — áp dụng cho **mọi** phase

- [ ] 420 unit/component test vẫn xanh (`pnpm test`)
- [ ] `pnpm build` · `pnpm typecheck` · `pnpm lint` sạch, không warning
- [ ] Không còn import Prisma cho domain vừa chuyển, ở cả hai app
- [ ] Comment trong mọi file đã chạm được rút gọn theo chuẩn: doc block ≤ 2 dòng, inline 1 dòng,
      không kể lại code
- [ ] Tài liệu của phase đã viết qua `write-tech-docs` và **mọi lệnh/code trong đó đã chạy thật**
- [ ] Hai app chạy được bình thường khi kết thúc phase

---

## Phase 1 — Nền móng + lát cắt dọc: CLIENT đọc catalog

**User stories:** 2, 5, 7, 8

### What to build

Lát cắt dọc mỏng nhất xuyên mọi tầng, chọn đường **chỉ đọc và không cần auth** để chứng minh đường
ống trước khi động vào phần rủi ro.

- `apps/api`: scaffold NestJS trên :3002, `PrismaModule` bọc client từ `@repo/db`, Swagger tại
  `/api/docs`
- `packages/contracts`: chuyển `catalogListParamsSchema` + type catalog vào đây
- `packages/api-client`: `apiFetch<T>()` — baseURL, map lỗi HTTP → `ApiError`, timeout. Chưa cần token
- API endpoints: `GET /products`, `GET /products/by-slug/:slug`, `GET /categories`, `GET /brands`
- **Quy tắc then chốt:** `GET /products` mặc định chỉ trả PUBLISHED. Lọc theo status khác đòi
  `product:read` — guard chưa có nên phase này từ chối thẳng mọi `?status=`
- CLIENT `lib/catalog/queries.ts`: đổi ruột từ Prisma sang `apiFetch`, giữ nguyên tên hàm, chữ ký
  và phần map sang shape UI
- ADMIN **không đụng tới** — vẫn chạy Prisma

### Acceptance criteria

- [x] `/api/docs` liệt kê đủ 4 endpoint, gọi thử được ngay trên trang
- [x] Trang chủ, `/products`, `/products/[slug]`, `/categories/[slug]`, `/brands/[slug]`,
      `/search`, `sitemap.xml` của CLIENT hiển thị y hệt trước
- [x] Sản phẩm DRAFT và ARCHIVED không xuất hiện ở bất kỳ đâu; `/products/<slug-draft>` trả **404**
- [x] `?status=DRAFT` bị bỏ qua, không lộ dữ liệu
- [x] API chết → CLIENT hiện trạng thái lỗi có nút thử lại, không trang trắng, không stack trace
- [x] CLIENT không còn import `@repo/db` ở tầng catalog
- [x] Tài liệu: `architecture.md`, `running-locally.md`, `api-project-setup.md`,
      `calling-the-api-from-next.md`

---

## Phase 2 — Auth + JWT guard

**User stories:** 1, 3, 9, 10

### What to build

Phase rủi ro nhất — hỏng là cả hai app sập. Làm riêng, không lẫn domain nào khác.

- `apps/api` `AuthModule`: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`,
  `POST /auth/change-password`
- `JwtAuthGuard` (xác thực chữ ký) + `@Permissions()` + `PermissionsGuard` (kiểm quyền)
- API kiểm `is_active` từ database ở **mỗi** request — JWT đã phát không tự biết tài khoản bị vô hiệu
- Tách `packages/auth` làm ba: `config.ts`/`guard.ts` ở lại BFF · `permissions.ts` sang
  `packages/contracts` · `user.ts` (bcrypt, `loadUserPermissions`, `isUserActive`) sang API
- `apiFetch` gắn `Authorization: Bearer` lấy từ session
- Auth.js `authorize()` của **cả hai app** gọi `POST /auth/login` thay vì Prisma
- CLIENT: trang `/account`, đăng ký, đổi mật khẩu chuyển sang API
- Áp guard cho `?status=` của `GET /products` (nợ từ phase 1)

### Acceptance criteria

- [x] Đăng nhập, đăng xuất, đăng ký, đổi mật khẩu chạy đúng trên **cả hai** app
- [x] Sai mật khẩu → một thông báo chung duy nhất, không chỉ ra sai email hay sai mật khẩu
- [x] Token thiếu quyền → API trả **403** kể cả khi BFF đã hiện nút
- [x] Tài khoản bị vô hiệu giữa phiên → **401** → BFF chuyển hướng `/login?next=…`
- [x] Token hết hạn → 401 → chuyển hướng, không vòng lặp redirect
- [x] Browser không thấy `accessToken` ở bất kỳ đâu: DOM, `localStorage`, cookie đọc được bằng JS
- [x] ADMIN vẫn từ chối tài khoản không có role nào
- [x] `packages/auth` không còn import `@repo/db`
- [x] Tài liệu: `api-authentication.md`

---

## Phase 3 — Products: đường ghi của ADMIN

**User stories:** 3, 6, 9

### What to build

Domain đầu tiên có write và `$transaction`. Màn hình phức tạp nhất của ADMIN, làm sớm để lộ vấn đề sớm.

- API: `POST /products`, `PATCH /products/:id`, `PATCH /products/:id/status`,
  `DELETE /products/:id`, `GET /products/:id`, `GET /products/stats` — đủ guard
- `$transaction` (sản phẩm + ảnh) chuyển **vào trong** service của API. BFF gọi một endpoint
- Unique violation → **409** kèm `errors.slug`
- `productFormSchema`, `productListParamsSchema` sang `packages/contracts`
- ADMIN `lib/products/queries.ts` + `actions.ts` đổi ruột sang `apiFetch`
- Map lỗi API → `ActionResult` cho form

### Acceptance criteria

- [x] Tạo, sửa, đổi trạng thái, xoá sản phẩm chạy đúng trên ADMIN
- [x] Slug trùng → lỗi hiện ngay dưới ô nhập, không phải trang lỗi
- [x] Sản phẩm nhiều ảnh lưu đúng thứ tự; ghi hỏng giữa chừng không để lại dữ liệu lệch
- [x] Người thiếu `product:delete` gọi thẳng endpoint vẫn bị API từ chối 403
- [x] Lọc, sắp xếp, phân trang danh sách ADMIN giữ nguyên hành vi, kể cả URL hỏng
- [x] Đổi trạng thái sang PUBLISHED ở ADMIN thì CLIENT thấy sản phẩm sau khi cache hết hạn
- [x] ADMIN `lib/products` không còn import `@repo/db`
- [x] Tài liệu: `adding-a-resource.md` (công thức chắt lọc sau 3 lần làm)

---

## Phase 4 — Taxonomy: categories + brands

**User stories:** 6, 9

### What to build

Nhỏ và lặp lại đúng pattern phase 3. Phase củng cố, đồng thời là bài kiểm tra cho
`adding-a-resource.md`: nếu tài liệu đó đúng thì phase này gần như chỉ là làm theo.

- API: `POST`/`PATCH`/`DELETE` cho `/categories` và `/brands` — guard `category:manage`,
  `brand:manage`
- Chặn xoá khi còn sản phẩm tham chiếu → **409**, giữ nguyên thông báo hiện tại
- `taxonomyFormSchema` sang `packages/contracts`
- ADMIN `lib/taxonomy/*` đổi ruột

### Acceptance criteria

- [x] CRUD categories và brands chạy đúng; slug trùng → 409 hiện trên field
- [x] Danh mục đang có sản phẩm thì không hiện nút xoá, và gọi thẳng endpoint cũng bị từ chối
- [x] Slug tự sinh từ tên, nhưng slug gõ tay thì không bị ghi đè (hành vi hiện tại)
- [x] CLIENT vẫn lọc theo category/brand đúng
- [x] ADMIN `lib/taxonomy` không còn import `@repo/db`
- [x] `adding-a-resource.md` được kiểm chứng và sửa lại nếu có bước sai

---

## Phase 5 — Users + Roles, và cắt dây cuối cùng

**User stories:** 3, 4, 6, 8, 9, 11

### What to build

Domain lớn nhất và nhiều `$transaction` nhất. Gộp users với roles vì chúng khoá chéo nhau —
`getUserDetail` trả role của user, `getRoleDetail` trả user giữ role đó; tách ra sẽ có giai đoạn
hai nguồn sự thật cho cùng một quan hệ và `$transaction` gán role không chạy được.

- API: `/users`, `/users/:id`, `/users/:id/status`, `/users/:id/roles`, `/roles`, `/roles/:id`,
  `/roles/:id/permissions`, `/permissions` — guard `user:manage`, `role:manage`
- Quy tắc chống tự khoá mình (`lockout.ts`) chuyển vào service của API
- `$transaction` gán/gỡ role nằm trong service
- ADMIN `lib/users/*` và `lib/roles/*` đổi ruột

**Cắt dây — chỉ làm được ở đây vì đây là chỗ dùng Prisma cuối cùng:**

- Gỡ `@repo/db` khỏi `package.json` của **cả hai** app
- `pnpm dev` khởi động 3 service
- README gốc + README hai app: sơ đồ kiến trúc, bảng lệnh, biến môi trường
- Đánh dấu plan cũ là superseded
- **Đo latency trước–sau** trên trang chủ và trang listing của CLIENT, ghi số thật vào tài liệu

### Acceptance criteria

- [x] CRUD users và roles chạy đúng; gán/gỡ role, đổi permission của role chạy đúng
- [x] Admin không thể tự gỡ quyền cuối cùng của chính mình — quy tắc enforce ở API
- [x] Email trùng → 409 trên field
- [x] Gán nhiều role cùng lúc: hoặc thành công hết, hoặc không đổi gì
- [x] Vô hiệu hoá tài khoản thì phiên đang mở của người đó bị chặn ở request kế tiếp
- [x] `grep -r "@repo/db" apps/` không trả về kết quả nào
- [x] `pnpm dev` chạy cả 3 service; README mô tả đúng cách chạy từ máy trắng
- [x] Số liệu latency trước–sau được ghi vào `architecture.md`
- [x] Tài liệu: `running-locally.md` cập nhật cho 3 service; `architecture.md` bổ sung số đo

---

## Rủi ro và cách xử lý

| Rủi ro | Phase | Xử lý |
|---|---|---|
| Auth hỏng làm sập cả hai app | 2 | Làm riêng một phase. Verify thủ công đủ 6 luồng (login/logout/register/đổi mật khẩu/hết hạn/vô hiệu) trước khi đóng phase |
| Latency tăng ngoài dự kiến | 1, 5 | Đo ở phase 1 ngay khi có endpoint đầu tiên. Nếu vượt xa 50ms thì dừng và xem lại vị trí deploy trước khi đi tiếp |
| Mất transaction boundary | 3, 5 | Transaction chuyển vào service của API, BFF chỉ gọi một endpoint. Không bao giờ ghép nhiều lời gọi API thành một thao tác logic |
| Test giả xanh vì mock quá tay | mọi phase | Mock ở tầng `apiFetch`, không mock service của chính app. Test schema và component không được sửa |
| Rò sản phẩm chưa phát hành | 1, 2 | Mặc định PUBLISHED ở API. Giữ fixture DRAFT/ARCHIVED trong seed để sai sót lộ ra ngay |
