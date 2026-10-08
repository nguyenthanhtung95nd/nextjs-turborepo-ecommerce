# Thêm một tính năng

Một tính năng mới thường chạm cả ba project. Tài liệu này chỉ nói **thứ tự làm và vì sao**; chi
tiết từng tầng nằm trong ba how-to riêng.

**Mục tiêu:** biết phải bắt đầu từ đâu, và không phải quay lại sửa vì làm sai thứ tự.

## Trước khi bắt đầu

- Hệ thống chạy được — xem [Chạy hệ thống trên máy local](./01-getting-started.md)
- Bảng đã có trong database (dự án này **database-first**: SQL trong `database/` là nguồn sự thật,
  Prisma chỉ sinh client từ database thật)

## Bản đồ

```
1. database/            bảng + ràng buộc              ← SQL viết tay, chạy bằng tay
          ▼
2. packages/contracts   schema + DTO                   ← cả ba bên dưới đều cần
          ▼
3. apps/api             service · controller · module  ← nơi quy tắc nghiệp vụ sống
          ▼
4. apps/admin           route handler → services → hook → màn hình
   apps/client          queries.ts → Server Component       (chỉ khi storefront cần)
```

Thứ tự này không tuỳ ý:

| Bước | Vì sao phải trước bước sau |
| --- | --- |
| Database trước contracts | Prisma sinh kiểu từ bảng thật; chưa có bảng thì chưa có kiểu |
| Contracts trước API và app | Schema là thứ cả hai bên cùng nói. Làm sau là phải sửa cả hai |
| API trước app | App gọi endpoint. Endpoint chưa có thì không test được gì |
| ADMIN và CLIENT độc lập nhau | Hai app không import lẫn nhau, làm song song được |

Làm sai thứ tự không hỏng gì ngay — chỉ tốn một vòng sửa lại.

---

## Bước 1 — Database

SQL viết tay trong `database/migrations/`, đánh số tăng dần, chạy theo đúng thứ tự (khoá ngoại
phụ thuộc vào nó).

```sql
-- database/migrations/010_create_coupons.sql
CREATE TABLE coupons (
  id          bigserial PRIMARY KEY,
  code        varchar(40) NOT NULL UNIQUE,
  percent_off int NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

Hai quy ước của tầng này:

- **Ràng buộc viết trong database.** `CHECK`, `UNIQUE`, `NOT NULL` là tuyến phòng thủ cuối, không
  thay thế được bằng validate ở tầng trên
- **Không có công cụ migration.** File SQL được chạy bằng tay trong DBeaver, và không file nào
  trong `database/` được phép `DROP`

Rồi cho Prisma đọc lại cấu trúc thật và sinh client:

```bash
pnpm --filter api run db:pull
```

## Bước 2 — Contracts

Schema và DTO cho resource mới, rồi export:

```ts
// packages/contracts/src/coupon.ts
export const couponFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required.")
    .regex(/^[A-Z0-9-]+$/, "Capital letters, numbers and hyphens only."),
  percentOff: z.coerce.number().int().min(1).max(100),
});

export type CouponFormInput = z.input<typeof couponFormSchema>;

/** Ids are strings — Postgres bigint is not JSON-serialisable. */
export interface CouponDto {
  id: string;
  code: string;
  percentOff: number;
}
```

```ts
// packages/contracts/src/index.ts
export * from "./coupon";
```

```bash
pnpm --filter @repo/contracts build
```

Chi tiết quy ước của tầng này: [Package dùng chung](./02-packages.md).

## Bước 3 — API

Service → controller → module, rồi đăng ký module. Nếu tính năng cần một quyền mới, thêm nó vào
`packages/contracts/src/permissions.ts` **và** `database/seed/reference/01_permissions.sql`.

→ [Thêm một endpoint](./15-api-add-endpoint.md)

## Bước 4 — ADMIN

Route handler → `services.ts` → hook React Query → màn hình → `page.tsx` kiểm quyền.

→ [Thêm một màn hình](./23-admin-add-a-screen.md)

## Bước 5 — CLIENT (nếu storefront cần)

Hàm query trong `lib/<domain>/queries.ts`, gọi từ Server Component, kèm `revalidate` và `tags`.

→ [Lấy dữ liệu trong CLIENT](./32-client-data-fetching.md)

---

## Kiểm tra

```bash
pnpm --filter @repo/contracts build
pnpm typecheck && pnpm lint && pnpm test
```

Rồi mở <http://localhost:3002/api/docs> — resource mới xuất hiện dưới tag của nó, có nút
**Try it out**. Gọi thử không kèm token phải trả 401.

## Danh sách kiểm

Chung cho mọi tính năng, bất kể nó chạm mấy project:

- [ ] SQL đã chạy, `db:pull` đã chạy lại
- [ ] Schema và DTO ở `packages/contracts`, đã build lại
- [ ] Id là `string` trong mọi DTO
- [ ] Quyền mới (nếu có) đã thêm ở **cả hai** nơi: contracts và seed SQL
- [ ] API kiểm quyền bằng guard; app chỉ dùng quyền để quyết định render gì
- [ ] Màn hình render đủ bốn trạng thái: đang tải, lỗi, rỗng, có dữ liệu
- [ ] Lỗi API được dịch sang câu người dùng đọc được, không lộ chi tiết nội bộ
- [ ] Có test ở tầng API và tầng app
- [ ] `pnpm typecheck && pnpm lint && pnpm test` xanh

## Đọc tiếp

- [Thêm một endpoint](./15-api-add-endpoint.md)
- [Thêm một màn hình](./23-admin-add-a-screen.md)
- [Lấy dữ liệu trong CLIENT](./32-client-data-fetching.md)
