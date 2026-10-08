# Vòng đời một request

Hướng dẫn này đi theo **một request duy nhất** — `GET /categories` — từ lúc nó chạm vào server cho
tới lúc JSON quay về. Trên đường đi bạn sẽ gặp controller, pipe, guard, exception filter và Swagger.

**Sau khi đọc xong bạn sẽ:** đọc hiểu bất kỳ controller nào trong `apps/api`, và biết chỗ nào chặn
một request hỏng trước khi nó đi sâu hơn.

## Trước khi bắt đầu

- Đã đọc [API làm gì](./10-api-overview.md) — tài liệu này giả định bạn đã thấy sơ đồ dây chuyền
- API chạy được: `pnpm --filter api dev`

---

## Bước 1 — Controller: dịch giữa HTTP và service

```ts
// apps/api/src/categories/categories.controller.ts
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List categories with their product counts" })
  @ApiQuery({
    name: "hasPublished",
    required: false,
    description: "Set to 1 to exclude categories with no published products.",
  })
  list(@Query("hasPublished") hasPublished?: string) {
    return this.categories.list(hasPublished === "1");
  }
}
```

| Decorator | Tác dụng |
| --- | --- |
| `@Controller("categories")` | Đặt tiền tố đường dẫn, nên `@Get()` thành `GET /categories` |
| `@Get(":id")` | `GET /categories/123`; `@Param("id")` lấy ra `"123"` |
| `@Query("hasPublished")` | Đọc một tham số trên query string |
| `@Body()` | Đọc JSON của request |
| `@ApiTags` / `@ApiOperation` / `@ApiQuery` | Chỉ phục vụ Swagger, **không** đổi hành vi |

**Controller không `await`.** Nó trả về Promise và Nest tự chờ. Thêm `async/await` vào cũng chạy
đúng, chỉ là thừa.

Chỉ thêm `async` khi hàm thật sự cần chờ xong mới trả về, như trường hợp trả 204 không có body:

```ts
@Patch(":id")
@HttpCode(HttpStatus.NO_CONTENT)
async update(@Param("id") id: string, @Body() body: TaxonomyFormDto) {
  await this.categories.update(id, body);
}
```

---

## Bước 2 — Pipe: validate đầu vào trước khi controller chạy

`GET /categories` chỉ có một tham số nên đọc thẳng là đủ. `GET /products` có tám tham số kèm quy
tắc riêng, nên nó dùng schema Zod có sẵn trong `@repo/contracts`:

```ts
// apps/api/src/products/products.controller.ts
import { catalogListParamsSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

class CatalogListQueryDto extends createZodDto(catalogListParamsSchema) {}

@Get()
list(@Query() query: CatalogListQueryDto, @Req() request: AuthedRequest) {
  return this.products.listPublished(query, canSeeAllStatuses(request));
}
```

Cơ chế hoạt động:

1. `createZodDto` biến một schema Zod thành class mà Nest nhận ra
2. `ZodValidationPipe` đã đăng ký toàn cục trong `app.module.ts`
3. Mỗi request tới, pipe thấy kiểu tham số là một DTO loại này nên tự validate
4. Không hợp lệ → ném `ZodValidationException`, controller **không** chạy

Nên trong controller, `query` luôn là dữ liệu đã được kiểm và đã ép kiểu — `page` là `number`,
không phải chuỗi `"2"` lấy từ URL.

Lợi ích thực tế: đúng schema này cũng được hai app Next dùng để đọc URL. Một định nghĩa, ba nơi
dùng, không có đường nào lệch nhau.

---

## Bước 3 — Guard: chặn trước khi vào

Guard trả lời đúng một câu: "request này có được đi tiếp không?" Nó chạy **trước cả pipe**.

```ts
// apps/api/src/categories/categories.controller.ts
@Post()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("category:manage")
@ApiBearerAuth()
create(@Body() body: TaxonomyFormDto) {
  return this.categories.create(body);
}
```

Đọc theo thứ tự chạy:

1. `JwtAuthGuard` đọc header `Authorization: Bearer ...`, xác minh token, nạp quyền hiện tại của
   người gọi **từ database** và gắn vào `request.user`
2. `PermissionsGuard` so `request.user.permissions` với danh sách trong `@Permissions(...)`
3. Thiếu quyền → ném `ForbiddenException`, controller không chạy

Vì bước 1 đọc quyền từ database ở **mỗi** request, một tài khoản vừa bị vô hiệu hoá sẽ bị chặn
ngay ở request kế tiếp, dù token của họ còn hạn.

**Thứ tự hai guard không được đảo.** `JwtAuthGuard` đặt `request.user`, `PermissionsGuard` đọc nó.
Đảo lại thì quyền luôn rỗng và mọi request đều 403.

Chi tiết token và phân quyền: [Xác thực và phân quyền](./14-api-authentication.md).

---

## Bước 4 — Service: nơi công việc thật diễn ra

```ts
// apps/api/src/categories/categories.service.ts
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(withPublishedOnly: boolean): Promise<TaxonomyDto[]> {
    const records = await this.prisma.categories.findMany({
      where: withPublishedOnly ? { products: { some: PUBLISHED_ONLY } } : {},
      orderBy: { name: "asc" },
      select: SELECT,
    });
    return this.decorate(records);
  }
}
```

Service không biết gì về HTTP: không `Request`, không `Response`, không status code. Nó nhận tham
số thường và trả về DTO.

Cách Prisma sinh câu SQL, vì sao trả DTO chứ không trả record, và transaction:
[Truy cập dữ liệu](./13-api-data-access.md).

---

## Bước 5 — Lỗi: ném exception, đừng dựng response

Service báo lỗi bằng exception có sẵn của Nest:

```ts
if (!record) throw new NotFoundException("Product not found.");
```

Mỗi exception ứng với một mã HTTP:

| Exception               | Mã HTTP | Dùng khi                                          |
| ----------------------- | ------- | ------------------------------------------------- |
| `NotFoundException`     | 404     | Không có bản ghi nào khớp                         |
| `ConflictException`     | 409     | Dữ liệu hợp lệ nhưng vi phạm quy tắc (slug trùng) |
| `UnauthorizedException` | 401     | Chưa đăng nhập, hoặc token hỏng/hết hạn           |
| `ForbiddenException`    | 403     | Đã đăng nhập nhưng không đủ quyền                 |
| `BadRequestException`   | 400     | Đầu vào sai hình dạng                             |

Một exception filter toàn cục biến tất cả thành cùng một body JSON:

```ts
// apps/api/src/common/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ZodValidationException) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Please fix the highlighted fields.",
        errors: toFieldErrors(exception),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({ statusCode: status, message: exception.message });
      return;
    }

    // Anything unrecognised is a bug. Log it in full, tell the caller nothing.
    this.logger.error("Unhandled exception", exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Something went wrong.",
    });
  }
}
```

Nhánh cuối là nhánh quan trọng nhất: lỗi không nhận ra được **ghi log đầy đủ ở server** nhưng
người gọi chỉ nhận một câu chung chung. Stack trace không bao giờ rời khỏi server.

Hình dạng body lỗi này được khai trong `@repo/contracts` (`ApiErrorBody`), nên cả hai app Next đọc
được nó mà không phải đoán.

---

## Bước 6 — Swagger

Swagger được dựng trong `main.ts`:

```ts
// apps/api/src/main.ts
const config = new DocumentBuilder()
  .setTitle("Commerce API")
  .setDescription("Catalog, identity and RBAC for the ADMIN and CLIENT projects.")
  .setVersion("1.0")
  .build();

SwaggerModule.setup("api/docs", app, cleanupOpenApiDoc(SwaggerModule.createDocument(app, config)));
```

`SwaggerModule.createDocument` đọc chính các decorator bạn đã viết — `@ApiTags`, `@ApiOperation`,
`@ApiQuery` — nên tài liệu không bao giờ lệch khỏi code.

`cleanupOpenApiDoc` đến từ `nestjs-zod` và bắt buộc phải có: thiếu nó, schema sinh từ Zod sẽ hiển
thị sai trên trang Swagger.

---

## Kiểm tra

```bash
pnpm --filter api dev
curl http://localhost:3002/categories
```

```json
[
  {
    "id": "213",
    "name": "Accessories",
    "slug": "accessories",
    "productCount": 6,
    "totalProductCount": 7,
    "updatedAt": "2026-10-07T04:33:00.926Z"
  }
]
```

Thử một route cần quyền mà không gửi token — guard phải chặn trước khi chạm vào service:

```bash
curl -X POST http://localhost:3002/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}'
```

```json
{ "statusCode": 401, "message": "Sign in to continue." }
```

Mở <http://localhost:3002/api/docs> — mọi endpoint xuất hiện theo tag, có mô tả tham số và nút
**Try it out** gọi thử được ngay trên trang.

---

## Bạn đã học được gì

- Controller chỉ ánh xạ HTTP ↔ lời gọi hàm, và không cần `await`
- Pipe validate bằng schema Zod dùng chung, nên controller luôn nhận dữ liệu đã ép kiểu
- Guard chạy trước pipe; `JwtAuthGuard` phải đứng trước `PermissionsGuard`
- Ném exception, đừng tự dựng response — exception filter cho mọi lỗi cùng một hình dạng
- Lỗi lạ: log đầy đủ ở server, trả câu chung chung cho người gọi
- Swagger sinh từ chính decorator trong code

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân |
| --- | --- |
| Route trả 404 dù code đúng | Module chưa thêm vào `imports` của `app.module.ts` |
| `Nest can't resolve dependencies of the XService` | Class cần inject chưa nằm trong `providers`, hoặc module giữ nó chưa `exports` |
| Mọi request đều 403 | `PermissionsGuard` đứng trước `JwtAuthGuard` |
| Mọi lỗi đều thành 500 | Service ném `Error` thường thay vì exception của Nest |
| Query param vào controller vẫn là chuỗi | Tham số chưa khai kiểu là DTO tạo bằng `createZodDto` |
| Swagger hiện schema rỗng | Thiếu `cleanupOpenApiDoc` trong `main.ts` |

## Đọc tiếp

- [Truy cập dữ liệu](./13-api-data-access.md) — Prisma, DTO, transaction
- [Xác thực và phân quyền](./14-api-authentication.md) — token và guard
- [Thêm một endpoint](./15-api-add-endpoint.md) — làm lại các bước trên cho bảng của bạn
