# Truy cập dữ liệu

API là project duy nhất mở kết nối database. Tài liệu này nói **Prisma hoạt động thế nào** và
**service phải tuân quy tắc gì** khi chạm vào dữ liệu.

**Sau khi đọc xong bạn sẽ:** viết được một service mới, biết lời gọi Prisma sinh ra SQL gì, và
biết vì sao service không bao giờ trả thẳng record ra ngoài.

## Trước khi bắt đầu

- Đã đọc [API làm gì](./10-api-overview.md)
- Database đang chạy — xem [Chạy hệ thống trên máy local](./01-getting-started.md)

---

## Prisma nằm ở đâu

```
apps/api/
├── prisma/
│   └── schema.prisma          mô tả các bảng — nguồn để sinh code
└── src/prisma/
    ├── prisma.service.ts      kết nối dùng chung
    ├── prisma.module.ts       công bố nó cho toàn ứng dụng
    └── prisma-error.ts        đọc mã lỗi của Prisma
```

Prisma **không** phải package dùng chung. Nó nằm trong `apps/api` vì API là project duy nhất được
mở kết nối database. Đặt nó vào `packages/*` sẽ ngụ ý rằng ai cũng dùng được.

## Code bạn gọi được sinh ra, không phải viết tay

`schema.prisma` mô tả các bảng. Lệnh `prisma generate` đọc file đó và **sinh ra** một thư viện
TypeScript vào `node_modules/@prisma/client`:

```bash
pnpm --filter api run db:generate
```

Vì thế `this.prisma.categories` tồn tại và gợi ý được trong IDE — nó được sinh từ
`model categories` trong schema. Thêm một bảng vào database mà chưa chạy lại lệnh này thì
TypeScript sẽ không biết bảng đó tồn tại.

**Chiều sinh code là từ database ra, không phải ngược lại.** Dự án này database-first: các file SQL
trong `database/` là nguồn sự thật, và `prisma db pull` đọc cấu trúc thật về:

```bash
pnpm --filter api run db:pull     # = prisma db pull + prisma generate
```

Đó cũng là lý do tên cột giữ nguyên snake_case (`updated_at`, `category_id`) thay vì camelCase.
Không có `prisma migrate` trong dự án này.

## `PrismaService` chính là Prisma client

```ts
// apps/api/src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

Class này **kế thừa** `PrismaClient`, nên nó _là_ Prisma client — không có lớp bọc nào ở giữa. Đó
là lý do service viết `this.prisma.categories.findMany(...)` chứ không phải
`this.prisma.client.categories...`.

`onModuleInit` và `onModuleDestroy` là **lifecycle hook**: Nest gọi chúng khi ứng dụng khởi động và
khi tắt. Nhờ vậy kết nối database được mở đúng một lần lúc bật và đóng gọn gàng lúc tắt.

### Công bố nó một lần cho toàn ứng dụng

```ts
// apps/api/src/prisma/prisma.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`@Global()` nghĩa là mọi module khác inject được `PrismaService` mà không phải import gì thêm.
Thiếu nó, từng module một sẽ phải tự khai báo `imports: [PrismaModule]`.

---

## Lời gọi Prisma tương ứng với SQL nào

```ts
await this.prisma.categories.findMany({
  where: { products: { some: { status: "PUBLISHED" } } },
  orderBy: { name: "asc" },
  select: { id: true, name: true, slug: true },
});
```

tương đương:

```sql
SELECT c.id, c.name, c.slug
FROM categories c
WHERE EXISTS (
  SELECT 1 FROM products p WHERE p.category_id = c.id AND p.status = 'PUBLISHED'
)
ORDER BY c.name ASC;
```

Đọc được phép ánh xạ này là đủ để đoán một truy vấn sẽ nặng hay nhẹ trước khi chạy nó.

---

## Bốn quy tắc của tầng service

| Quy tắc | Vì sao |
| --- | --- |
| `select` liệt kê rõ cột cần | Không có `select`, Prisma lấy mọi cột — kể cả `password_hash` |
| Khoá chính đổi sang chuỗi trước khi trả ra | JSON không biểu diễn được `BigInt` |
| Trả DTO, không trả record Prisma | Record mang tên cột database và trường không ai cần |
| Id vào thì validate, không ép thẳng `BigInt(id)` | `BigInt("abc")` ném lỗi kiểu khác và thành 500 |

```ts
// apps/api/src/categories/categories.service.ts
const SELECT = {
  id: true,
  name: true,
  slug: true,
  updated_at: true,
  _count: { select: { products: true } },
} as const;
```

```ts
/** @throws {NotFoundException} rather than letting a malformed id reach Prisma as a crash. */
function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Category not found.");
  return BigInt(id);
}
```

Record Prisma có `updated_at` và `_count`; `TaxonomyDto` chỉ chứa thứ bên gọi cần, với tên
camelCase (`updatedAt`, `productCount`). Việc đổi tên đó là ranh giới: khi database đổi tên cột,
chỗ phải sửa là một hàm map, không phải mọi component.

---

## Ghi nhiều bước phải nằm trong một transaction

Nếu một thao tác cần nhiều lần ghi, chúng phải nằm **trong cùng một method của service**:

```ts
// apps/api/src/products/products.service.ts
await this.prisma.$transaction([
  this.prisma.products.update({ where: { id: productId }, data: toColumns(values) }),
  this.prisma.product_images.deleteMany({ where: { product_id: productId } }),
  this.prisma.product_images.createMany({
    data: toImageRows(values.images).map((row) => ({ ...row, product_id: productId })),
  }),
]);
```

Ghép hai lời gọi API ở phía app trông thì giống, nhưng nếu lời gọi thứ hai hỏng thì lời gọi thứ
nhất đã ghi rồi — và không có gì quay lại được. Đây là lý do một thao tác logic không bao giờ được
tách thành nhiều endpoint.

---

## Lỗi của database thành lỗi của người dùng

Postgres báo vi phạm ràng buộc bằng mã lỗi. Prisma chuyển chúng thành mã riêng của nó, và service
dịch tiếp sang exception của Nest:

```ts
// apps/api/src/categories/categories.service.ts
export function toWriteFailure(error: unknown, singular: string): Error {
  const code = prismaErrorCode(error);
  if (code === UNIQUE_VIOLATION) {
    const field = prismaErrorTarget(error).includes("name") ? "name" : "slug";
    return new ConflictException(`Another ${singular} already uses this ${field}.`);
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return new ConflictException(
      `This ${singular} is still used by products, so it can't be deleted.`,
    );
  }
  if (code === "P2025") return new NotFoundException(`${singular} not found.`);
  return error instanceof Error ? error : new Error(String(error));
}
```

| Mã Prisma | Nghĩa | Dịch thành |
| --- | --- | --- |
| `P2002` | Vi phạm `UNIQUE` | `ConflictException` (409) |
| `P2003` | Vi phạm khoá ngoại | `ConflictException` (409) |
| `P2025` | Không tìm thấy bản ghi để sửa/xoá | `NotFoundException` (404) |

Không dịch thì "slug này đã có người dùng" biến thành một lỗi 500 vô nghĩa, và người dùng không
biết phải sửa gì.

---

## Test service mà không cần database

Vì service nhận Prisma qua constructor, test truyền vào một object giả:

```ts
// apps/api/tests/products.service.test.ts
const prisma = { products: { findMany, count, findFirst } };
const service = new ProductsService(prisma as never);
```

```bash
pnpm --filter api test
```

Mock ở **đúng tầng Prisma** — không mock chính service đang test, và cũng không dựng server HTTP
chỉ để kiểm một quy tắc nghiệp vụ.

---

## Bạn đã học được gì

- Prisma nằm trong `apps/api`, không phải package dùng chung
- Client được **sinh ra** từ `schema.prisma`; bảng mới thì phải chạy lại `db:generate`
- Schema sinh ngược từ database (`db:pull`) — SQL mới là nguồn sự thật, không có `prisma migrate`
- `PrismaService` kế thừa `PrismaClient`, nên gọi thẳng `this.prisma.<bảng>`
- Service: `select` rõ cột · `BigInt` → chuỗi · trả DTO · validate id vào
- Nhiều lần ghi phải nằm trong một `$transaction`
- Mã lỗi Prisma được dịch sang exception của Nest ngay trong service

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân |
| --- | --- |
| `Property 'coupons' does not exist on type 'PrismaService'` | Bảng mới chưa sinh lại client — chạy `db:generate` |
| `Do not know how to serialize a BigInt` | Quên `.toString()` cho khoá chính trước khi trả ra |
| Trả về cả `password_hash` | Thiếu `select` trong truy vấn |
| Slug trùng thành lỗi 500 | Chưa dịch `P2002` sang `ConflictException` |
| Xoá một nửa rồi lỗi, dữ liệu dở dang | Nhiều lần ghi không nằm trong `$transaction` |

## Đọc tiếp

- [Vòng đời một request](./12-api-request-lifecycle.md) — tầng trên của service
- [Cấu trúc thư mục API](./11-api-structure.md) — file mới đặt ở đâu
- [Thêm một endpoint](./15-api-add-endpoint.md)
