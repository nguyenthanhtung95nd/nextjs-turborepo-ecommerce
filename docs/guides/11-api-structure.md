# Cấu trúc thư mục API

Tài liệu này trả lời: **tôi vừa viết một file trong `apps/api`, nó thuộc về đâu?**

## Quy tắc trong bốn dòng

```
src/<resource>/     một thư mục một resource — service · controller · module
src/prisma/         kết nối database, dùng chung toàn ứng dụng
src/common/         thứ mọi resource cùng dùng (exception filter)
src/auth/           cấp token, guard — vừa là resource vừa là hạ tầng
```

Một câu hỏi để quyết định: **nó phục vụ một resource hay mọi resource?** Một thì vào thư mục
resource, mọi thì ra `common/` (hoặc `prisma/`, `auth/` nếu đúng chủ đề đó).

## Cây thư mục

```
apps/api/
├── prisma/
│   └── schema.prisma             mô tả bảng — sinh ngược từ database bằng `db:pull`
├── src/
│   ├── main.ts                   khởi động: filter toàn cục, Swagger, listen
│   ├── app.module.ts             module gốc — MỌI module phải được đăng ký ở đây
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts     kết nối dùng chung (kế thừa PrismaClient)
│   │   ├── prisma.module.ts      @Global — công bố cho toàn ứng dụng
│   │   └── prisma-error.ts       đọc mã lỗi P2002 / P2003 / P2025
│   │
│   ├── common/
│   │   └── http-exception.filter.ts   mọi exception → một hình dạng JSON
│   │
│   ├── auth/
│   │   ├── auth.service.ts       đối chiếu mật khẩu, nạp quyền từ database
│   │   ├── auth.controller.ts    POST /auth/login · GET /auth/me
│   │   ├── auth.module.ts
│   │   ├── jwt-auth.guard.ts     đọc Bearer token → request.user
│   │   └── permissions.guard.ts  so quyền của request.user với @Permissions
│   │
│   ├── products/                 service · controller · module
│   ├── categories/               service · controller · module
│   ├── brands/                   service · controller · module
│   ├── users/                    service · controller · module
│   └── roles/
│       ├── roles.service.ts
│       ├── roles.controller.ts
│       ├── roles.module.ts
│       └── lockout.ts            quy tắc thuần: đừng xoá mất quyền role:manage cuối cùng
│
├── tests/                        Vitest — 5 file
├── nest-cli.json
├── tsconfig.json
└── vitest.config.ts
```

Sáu resource: `products` · `categories` · `brands` · `users` · `roles` · `auth`.

## Một resource gồm ba file

```
src/categories/
├── categories.service.ts      logic nghiệp vụ + truy vấn database
├── categories.controller.ts   định tuyến HTTP + khai báo quyền
└── categories.module.ts       nối hai file trên lại
```

| File | Được phép | Không được phép |
| --- | --- | --- |
| `*.service.ts` | Gọi Prisma, ném exception của Nest, trả DTO | Biết `Request`, `Response`, header, status code |
| `*.controller.ts` | Đọc `@Query` / `@Body` / `@Param`, gọi service | Gọi Prisma, chứa quy tắc nghiệp vụ |
| `*.module.ts` | Liệt kê controller và provider | Mọi thứ khác |

Quy tắc dễ kiểm nhất: **không file controller nào được import Prisma.**

```bash
grep -rn "prisma" apps/api/src/*/*.controller.ts   # không in ra gì
```

### Khi nào tách thêm file thứ tư

Khi một quy tắc là **hàm thuần** và đáng được test riêng. Ví dụ duy nhất hiện có là
`roles/lockout.ts`:

```ts
// apps/api/src/roles/lockout.ts
export function wouldOrphanRoleManage({
  roleGrantsManage,
  changeKeepsManage,
  anotherRoleGrantsManage,
}: {
  roleGrantsManage: boolean;
  changeKeepsManage: boolean;
  anotherRoleGrantsManage: boolean;
}): boolean {
  if (!roleGrantsManage) return false; // nothing to lose
  if (changeKeepsManage) return false; // still granted here
  return !anotherRoleGrantsManage; // only a problem when no one else grants it
}
```

Nó không chạm database, không chạm HTTP, nên test được bằng ba dòng. Nếu quy tắc của bạn cần
Prisma thì nó thuộc về service, không tách ra.

## Đăng ký module — bước hay quên nhất

Viết xong `categories.module.ts` vẫn chưa đủ. Nest chỉ biết tới module nào có mặt trong cây bắt
đầu từ `AppModule`:

```ts
// apps/api/src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    UsersModule,
    RolesModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
```

> **Quên dòng đăng ký này là lỗi phổ biến nhất với người mới.** Code biên dịch sạch, không cảnh
> báo gì, nhưng route trả **404**.

`ConfigModule.forRoot({ isGlobal: true })` đứng đầu danh sách là có chủ đích: nó nạp `.env` vào
`process.env` **trước** khi các module khác đọc biến môi trường.

### Hai danh sách trong một module

```ts
@Module({
  controllers: [CategoriesController], // class có route — Nest quét decorator để dựng bảng định tuyến
  providers: [CategoriesService], // class có thể được inject
})
export class CategoriesModule {}
```

Một class không nằm trong `providers` thì không inject được. Một module muốn cho module khác dùng
provider của mình thì phải `exports` nó — trừ khi nó `@Global()` như `PrismaModule`.

## Đặt tên

| Loại | Quy ước | Ví dụ |
| --- | --- | --- |
| Thư mục resource | số nhiều, kebab-case | `products/`, `product-images/` |
| File | `<resource>.<vai trò>.ts` | `products.service.ts` |
| Class | `PascalCase` khớp tên file | `ProductsService` |
| Hằng số | `UPPER_SNAKE_CASE` | `PUBLISHED_ONLY` |
| Hàm thuần tách riêng | kebab-case theo chủ đề | `lockout.ts`, `prisma-error.ts` |

Tên file dùng số nhiều vì nó khớp tên bảng trong database (`products`, `categories`), và nhờ vậy
`this.prisma.products` đọc liền mạch với `ProductsService`.

## Test

```
apps/api/tests/
├── auth.service.test.ts         đối chiếu mật khẩu, nạp quyền
├── auth.integration.test.ts     dây chuyền guard → controller
├── products.service.test.ts     quy tắc lọc trạng thái
├── role-lockout.test.ts         hàm thuần wouldOrphanRoleManage
└── prisma-error.test.ts         đọc mã lỗi Prisma
```

Test đặt ở `tests/` chứ không cạnh file nguồn, và mock ở tầng **Prisma** — truyền một object giả
vào constructor của service. Mock sâu hơn mức đó là tự kiểm tra mock của mình.

```bash
pnpm --filter api test
```

## Tự kiểm tra

```bash
# 1. Controller không được chạm Prisma
grep -rn "prisma" apps/api/src/*/*.controller.ts

# 2. Mọi module đều đã đăng ký trong app.module.ts
for f in apps/api/src/*/*.module.ts; do
  name=$(grep -o "export class [A-Za-z]*Module" "$f" | sed 's/export class //')
  grep -q "$name" apps/api/src/app.module.ts || echo "CHƯA ĐĂNG KÝ: $name"
done

# 3. Service không import gì từ express
grep -rn "express\|Response" apps/api/src/*/*.service.ts
```

## Đọc tiếp

- [API làm gì](./10-api-overview.md) — vai trò và dây chuyền request
- [Vòng đời một request](./12-api-request-lifecycle.md) — từng tầng chạy ra sao
- [Thêm một endpoint](./15-api-add-endpoint.md) — công thức đầy đủ
