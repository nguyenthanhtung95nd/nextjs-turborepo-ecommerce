# Package dùng chung

Năm package trong `packages/*` chứa những thứ nhiều project cùng cần. Tài liệu này nói **cái gì
nằm trong package nào** và **khi nào import cái nào**.

Quy tắc một chiều, không có ngoại lệ: `apps/*` được import `packages/*`; `packages/*` **không bao
giờ** import `apps/*`.

## Bảng tra nhanh

| Tôi cần                                     | Import từ          |
| ------------------------------------------- | ------------------ |
| Zod schema, DTO, hằng số của API            | `@repo/contracts`  |
| Gọi API từ phía server                      | `@repo/api-client` |
| Button, Input, Dialog… và helper định dạng  | `@repo/ui`         |
| Phiên đăng nhập, kiểm quyền, băm mật khẩu   | `@repo/auth`       |
| Cấu hình ESLint / Prettier / tsconfig / CSS | `@repo/config`     |

| Package            | Ai dùng         | Ship dạng |
| ------------------ | --------------- | --------- |
| `@repo/contracts`  | API + hai app   | `dist/`   |
| `@repo/api-client` | hai app         | `dist/`   |
| `@repo/ui`         | hai app         | source    |
| `@repo/auth`       | hai app         | source    |
| `@repo/config`     | tất cả          | source    |

Package mà **API** dùng phải biên dịch ra `dist/`, vì NestJS build bằng `tsc` chứ không phải
bundler — nó không transpile được TypeScript nguồn của package khác. Package chỉ hai app Next dùng
thì ship source và được app biên dịch qua `transpilePackages`.

---

## `@repo/contracts` — từ vựng chung

Chín file, mỗi file một vùng nghiệp vụ:

```
packages/contracts/src/
├── auth.ts          đăng nhập, đăng ký, đổi mật khẩu
├── catalog.ts       tham số duyệt catalog của storefront
├── product.ts       form sản phẩm, DTO sản phẩm, thống kê
├── taxonomy.ts      category và brand
├── rbac.ts          user, role, permission
├── permissions.ts   danh mục 8 permission
├── money.ts         chuyển đổi tiền ↔ cents
├── search.ts        làm sạch từ khoá tìm kiếm
└── errors.ts        hình dạng body lỗi của API
```

Mỗi schema được dùng **hai lần**:

```ts
// apps/api — biến schema thành DTO của NestJS
class ProductFormDto extends createZodDto(productFormSchema) {}

// apps/admin — validate form trước khi gửi
const parsed = productFormSchema.safeParse(input);
```

Một định nghĩa thì `tsc` bắt được khi hai bên lệch nhau; hai định nghĩa thì chỉ vỡ lúc chạy.

Ba quy tắc cho tầng này:

- **Id luôn là `string`.** JSON không có `bigint`
- **Thông báo lỗi viết ngay trong schema**, để API và form nói cùng một câu
- **Không có gì thuộc về giao diện ở đây.** Nhãn hiển thị, thứ tự cột, bản dịch — ở lại app

Sửa xong phải build lại, vì API đọc bản `dist`:

```bash
pnpm --filter @repo/contracts build
```

### Ví dụ: một từ khoá tìm kiếm, một định nghĩa

```ts
// packages/contracts/src/search.ts
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

export const searchTermSchema = z
  .string()
  .transform((value) => value.replace(CONTROL_CHARACTERS, "").trim().slice(0, MAX_SEARCH_LENGTH))
  .catch("");
```

Cả ba project dùng chung nó, nên `?q=%00` bị loại trước khi chạm database ở bất kỳ đường nào.

---

## `@repo/api-client` — lối ra API từ phía server

```ts
import { ApiError, ApiUnavailableError, apiFetch } from "@repo/api-client";

const page = await apiFetch<PageDto<ProductCardDto>>("/products?page=1", { token });
```

| Việc      | Chi tiết                                           |
| --------- | -------------------------------------------------- |
| Base URL  | Đọc từ biến môi trường `API_URL`                   |
| Xác thực  | Gắn `Authorization: Bearer` khi được truyền token  |
| Lỗi       | Mọi phản hồi không phải 2xx thành `ApiError`       |
| Timeout   | Bỏ cuộc sau 10 giây thay vì treo vô hạn            |

Hai lớp lỗi nó ném ra:

```ts
ApiError; // API trả lời, nhưng là 4xx hoặc 5xx. Có .status và .fieldErrors
ApiUnavailableError; // API không trả lời: sập, không tới được, hoặc chậm quá timeout
```

> **Chỉ dùng được ở phía server.** Nó cần `API_URL` và token, hai thứ không có trong trình duyệt.
> Trong ADMIN, trình duyệt gọi route handler bằng axios (`services/api-client.ts`), và chính route
> handler mới gọi `apiFetch`.

---

## `@repo/ui` — component và helper dùng chung hai app

Import theo subpath, không có barrel file — mỗi component là một đường dẫn riêng để bundler loại
được phần không dùng:

```ts
import { Button } from "@repo/ui/button";
import { formatMoney } from "@repo/ui/format";
```

| Nhóm           | Nội dung                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| Component (10) | `button` `input` `label` `select` `textarea` `badge` `avatar` `dialog` `dropdown-menu` `sheet` |
| `cn`           | Ghép class Tailwind                                                          |
| `format`       | Định dạng tiền, ngày, số nhiều (`pluralize`)                                 |
| `list-href`    | Dựng URL danh sách, bỏ tham số mang giá trị mặc định                         |
| `action-result` | Kiểu kết quả chung cho mọi thao tác ghi: thành công, hoặc lỗi kèm `fieldErrors` |

Component ở đây là loại **không biết gì về nghiệp vụ**. `ProductCard` không nằm đây — nó biết sản
phẩm là gì, nên nó thuộc về app.

Cách viết một primitive — props, `cn`, `cva`, `asChild`, `"use client"` — nằm ở
[Viết component cho `@repo/ui`](./04-ui-components.md).

---

## `@repo/auth` — phiên đăng nhập và phân quyền

Auth.js v5 giữ **cookie phiên** cho mỗi app. Nó không tự kiểm mật khẩu: `authorize()` gửi thông
tin đăng nhập tới `POST /auth/login`, và JWT của API được cất bên trong cookie `httpOnly`.

| Export                        | Dùng để                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `handlers`                    | `export const { GET, POST } = handlers` trong `app/api/auth/[...nextauth]/route.ts` |
| `auth()`                      | Đọc phiên hiện tại trong Server Component                              |
| `sessionToken()`              | Token để truyền cho `apiFetch`                                         |
| `checkSession(session)`       | Hỏi API xem phiên còn sống: `active` / `inactive` / `unreachable`      |
| `requirePermission(key)`      | Guard phía server — ném `ForbiddenError` (403) khi thiếu quyền          |
| `hasPermission(session, key)` | Kiểm tra dạng boolean, dùng để quyết định render gì                     |
| `PERMISSIONS` / `Permission`  | Danh mục quyền, re-export từ `@repo/contracts`                          |
| `hashPassword` / `verifyPassword` | Băm và đối chiếu mật khẩu (chỉ API dùng)                            |

**`checkSession` trả ba trạng thái, không phải hai.** Một tài khoản bị vô hiệu hoá và một API đang
chết trông giống nhau từ phía client, nhưng cách xử lý khác hẳn: một cái cần gặp quản trị viên,
một cái chỉ cần chờ. `isSessionActive` còn đó nhưng đã `@deprecated` vì nó gộp hai trường hợp này.

Guard ở đây quyết định **render cái gì**; API quyết định **cái gì được phép**. API đọc lại tài
khoản và quyền từ database ở mọi request, nên một tài khoản vừa bị khoá sẽ bị từ chối ngay ở lần
gọi kế tiếp dù cookie vẫn còn hạn.

### Cấu hình bắt buộc

Mỗi app cần `AUTH_SECRET`, `AUTH_COOKIE_PREFIX` và `API_URL`, đồng thời khai báo
`transpilePackages: ["@repo/auth", "@repo/ui"]`.

> **`AUTH_COOKIE_PREFIX` phải khác nhau giữa hai app.** Cookie không phân biệt cổng, nên trên
> `localhost` một tên cookie dùng chung sẽ khiến app này đăng xuất app kia.

---

## `@repo/config` — cấu hình công cụ

Không có bước build, chỉ export file cấu hình qua subpath:

| Export                            | Ai dùng                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `@repo/config/eslint`             | `eslint.config.mjs` của từng app và của gốc repo               |
| `@repo/config/prettier`           | `prettier.config.mjs` ở gốc — chi phối toàn repo               |
| `@repo/config/tsconfig`           | Mọi `tsconfig.json` qua `"extends"`                            |
| `@repo/config/tailwind/theme.css` | `globals.css` của từng app qua `@import`                       |

```json
// apps/admin/tsconfig.json
{ "extends": "@repo/config/tsconfig", "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

Một chỗ sửa, mọi project đổi theo — đó là lý do cấu hình không bị trôi giữa ba app.

## Đọc tiếp

- [Kiến trúc](./00-architecture.md) — vì sao chia thành ba project
- [Viết component cho `@repo/ui`](./04-ui-components.md)
- [Thêm một tính năng](./03-add-a-feature.md) — package nào đụng trước
