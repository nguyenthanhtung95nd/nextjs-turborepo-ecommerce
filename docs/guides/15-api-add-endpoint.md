# Thêm một endpoint

Công thức lặp lại để đưa một bảng trong database ra thành endpoint. Mọi resource trong `apps/api`
đều đi theo đúng các bước này.

**Mục tiêu:** thêm một resource mới mà không phải tự nghĩ ra kiến trúc.

## Trước khi bắt đầu

- Đã đọc [API làm gì](./10-api-overview.md) và [Truy cập dữ liệu](./13-api-data-access.md)
- Bảng đã có trong database và Prisma client đã sinh (`pnpm --filter api run db:pull`)

Ví dụ xuyên suốt: bảng `coupons` với hai cột `code` và `percent_off`.

---

## Bước 1 — Contracts

Hai thứ ở đây: quy tắc validate (Zod) và hình dạng dữ liệu (DTO).

```ts
// packages/contracts/src/coupon.ts
import { z } from "zod";

export const couponFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required.")
    .regex(/^[A-Z0-9-]+$/, "Capital letters, numbers and hyphens only."),
  percentOff: z.coerce.number().int().min(1).max(100),
});

export type CouponFormInput = z.input<typeof couponFormSchema>;
export type CouponFormValues = z.output<typeof couponFormSchema>;

/** Ids are strings — Postgres bigint is not JSON-serialisable. */
export interface CouponDto {
  id: string;
  code: string;
  percentOff: number;
}
```

Rồi export nó:

```ts
// packages/contracts/src/index.ts
export * from "./coupon";
```

Ba quy tắc cho tầng này:

- **Id luôn là `string`.** JSON không có `bigint`
- **Thông báo lỗi viết ngay trong schema**, để API và form nói cùng một câu
- **Không có gì thuộc về giao diện ở đây.** Nhãn hiển thị, thứ tự cột, bản dịch — ở lại app

Build lại package sau mỗi lần sửa, vì API đọc bản `dist`:

```bash
pnpm --filter @repo/contracts build
```

---

## Bước 2 — Service

Service là nơi duy nhất chạm database, và là nơi quy tắc nghiệp vụ sống.

```ts
// apps/api/src/coupons/coupons.service.ts
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CouponDto, CouponFormValues } from "@repo/contracts";
import { UNIQUE_VIOLATION, prismaErrorCode } from "../prisma/prisma-error";
import { PrismaService } from "../prisma/prisma.service";

const NUMERIC_ID = /^\d+$/;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CouponDto[]> {
    const records = await this.prisma.coupons.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, percent_off: true },
    });
    return records.map(toDto);
  }

  async create(values: CouponFormValues): Promise<{ id: string }> {
    try {
      const created = await this.prisma.coupons.create({
        data: { code: values.code, percent_off: values.percentOff },
      });
      return { id: created.id.toString() };
    } catch (error) {
      if (prismaErrorCode(error) === UNIQUE_VIOLATION) {
        throw new ConflictException("Another coupon already uses this code.");
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.prisma.coupons.delete({ where: { id: toId(id) } });
  }
}

/** @throws {NotFoundException} rather than letting a malformed id reach Prisma as a crash. */
function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Coupon not found.");
  return BigInt(id);
}

function toDto(record: { id: bigint; code: string; percent_off: number }): CouponDto {
  return { id: record.id.toString(), code: record.code, percentOff: record.percent_off };
}
```

Bốn điều luôn đúng ở tầng này — chi tiết trong [Truy cập dữ liệu](./13-api-data-access.md):

| Quy tắc | Vì sao |
| --- | --- |
| Trả DTO, không trả record Prisma | Record mang tên cột database và trường không ai cần |
| Id vào thì validate, không ép thẳng `BigInt(id)` | `BigInt("abc")` ném lỗi kiểu khác và thành 500 |
| Vi phạm ràng buộc → `ConflictException` | Đó là kết quả dự kiến của dữ liệu hợp lệ, không phải sự cố |
| Nhiều lần ghi phải nằm trong `$transaction` | Hỏng giữa chừng thì không có gì quay lại được |

---

## Bước 3 — Controller

Controller chỉ định tuyến và khai báo quyền.

```ts
// apps/api/src/coupons/coupons.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { couponFormSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Permissions, PermissionsGuard } from "../auth/permissions.guard";
import { CouponsService } from "./coupons.service";

class CouponFormDto extends createZodDto(couponFormSchema) {}

@ApiTags("coupons")
@Controller("coupons")
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("coupon:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List coupons" })
  list() {
    return this.coupons.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("coupon:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a coupon" })
  create(@Body() body: CouponFormDto) {
    return this.coupons.create(body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("coupon:manage")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a coupon" })
  async remove(@Param("id") id: string) {
    await this.coupons.remove(id);
  }
}
```

**`JwtAuthGuard` phải đứng trước `PermissionsGuard`** — guard đầu đặt `request.user`, guard sau
đọc nó. Đảo lại thì quyền luôn rỗng và mọi request đều 403.

Endpoint công khai nhưng trả nhiều hơn khi có quyền thì dùng `OptionalJwtGuard` — xem
[Xác thực và phân quyền](./14-api-authentication.md).

---

## Bước 4 — Module, và đăng ký nó

```ts
// apps/api/src/coupons/coupons.module.ts
import { Module } from "@nestjs/common";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";

@Module({
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
```

```ts
// apps/api/src/app.module.ts
@Module({
  imports: [
    // ...
    CouponsModule, // ← dòng hay quên nhất
  ],
})
export class AppModule {}
```

Quên dòng này: biên dịch sạch, không cảnh báo, route trả **404**.

---

## Bước 5 — Quyền mới

Nếu endpoint dùng một quyền chưa tồn tại, nó phải được thêm ở **hai** nơi, nếu không guard sẽ từ
chối mọi người:

```ts
// packages/contracts/src/permissions.ts
export const PERMISSIONS = [
  // ...
  "coupon:read",
  "coupon:manage",
] as const;
```

```sql
-- database/seed/reference/01_permissions.sql — idempotent, chạy ở mọi môi trường
INSERT INTO permissions (key, description) VALUES
  ('coupon:read',   'View coupons'),
  ('coupon:manage', 'Create and delete coupons')
ON CONFLICT (key) DO NOTHING;
```

Rồi gán quyền cho role trong `database/seed/dev/01_roles.sql` để tài khoản dev dùng được.

---

## Bước 6 — Test

Mock Prisma, kiểm quy tắc nghiệp vụ — không dựng server:

```ts
// apps/api/tests/coupons.service.test.ts
it("reports a duplicate code as a conflict, not a server error", async () => {
  const create = vi.fn().mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
  const service = new CouponsService({ coupons: { create } } as never);

  await expect(service.create({ code: "SAVE10", percentOff: 10 })).rejects.toBeInstanceOf(
    ConflictException,
  );
});
```

```bash
pnpm --filter api test
```

---

## Kiểm tra

```bash
pnpm --filter @repo/contracts build
pnpm --filter api build
pnpm typecheck && pnpm test
```

Rồi mở <http://localhost:3002/api/docs> — resource mới xuất hiện dưới tag của nó, có nút
**Try it out**. Gọi thử không kèm token phải trả 401.

## Danh sách kiểm

- [ ] Schema và DTO ở `packages/contracts`, đã build lại
- [ ] Id là `string` trong mọi DTO
- [ ] Service trả DTO, validate id vào, map vi phạm ràng buộc sang `ConflictException`
- [ ] Ghi nhiều bước nằm trong một `$transaction`
- [ ] Controller: `JwtAuthGuard` trước `PermissionsGuard`, có `@Permissions`, có `@ApiOperation`
- [ ] Module đã đăng ký trong `app.module.ts`
- [ ] Quyền mới đã thêm ở **cả** contracts và seed SQL
- [ ] Có test ở tầng service

## Đọc tiếp

- [Thêm một màn hình](./23-admin-add-a-screen.md) — nối endpoint này vào ADMIN
- [Thêm một tính năng](./03-add-a-feature.md) — thứ tự tổng thể
