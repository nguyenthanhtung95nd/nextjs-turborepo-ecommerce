# API làm gì

`apps/api` là một ứng dụng **NestJS** chạy ở cổng 3002. Nó là nơi duy nhất trong hệ thống mở kết
nối database, và là nơi duy nhất quyết định ai được làm gì.

**Sau khi đọc xong bạn sẽ:** hiểu một request đi qua những tầng nào, mỗi tầng chịu trách nhiệm gì,
và vì sao NestJS bắt tách controller khỏi service.

## Trước khi bắt đầu

- Biết TypeScript cơ bản: `class`, `interface`, `async/await`
- **Không** cần biết NestJS, decorator hay Prisma từ trước

> **Decorator là gì?** Là những dòng bắt đầu bằng `@` đứng ngay trên một class hoặc một hàm, ví dụ
> `@Injectable()` hay `@Get()`. Chúng không chạy logic gì cả — chúng chỉ **gắn nhãn**. NestJS đọc
> các nhãn này lúc khởi động để biết class nào là gì và URL nào gọi vào hàm nào. Cứ đọc chúng như
> những ghi chú mà framework hiểu được.

---

## API chịu trách nhiệm gì

| Thuộc về API | **Không** thuộc về API |
| --- | --- |
| Quy tắc nghiệp vụ (chỉ PUBLISHED mới ra storefront) | Trạng thái giao diện, bộ lọc trên URL |
| Phân quyền — ai được đọc, sửa, xoá | Ẩn/hiện nút bấm |
| Băm và đối chiếu mật khẩu | Cookie phiên của trình duyệt |
| Mọi truy vấn database | Nắn dữ liệu cho một màn hình cụ thể |
| Hình dạng JSON trả ra (DTO) | Nhãn hiển thị, bản dịch |

Cột phải thuộc về tầng BFF — xem [Kiến trúc](./00-architecture.md).

Quy tắc đáng nhớ nhất: **API không tin bên gọi.** Hai app Next cũng chỉ là hai consumer như mọi
consumer khác. Mọi kiểm tra đều lặp lại ở đây, kể cả khi app đã kiểm rồi.

---

## Một request đi qua những đâu

Đây là thứ cần nắm trước mọi thứ khác. Khi một request tới, NestJS đẩy nó qua một dây chuyền cố
định, **theo đúng thứ tự này**:

```
GET /categories
      │
      ▼
┌─────────────────┐
│  main.ts        │  Nest đã dựng sẵn toàn bộ ứng dụng lúc khởi động
└────────┬────────┘
         ▼
┌─────────────────┐
│  Guard          │  "Người này có được vào không?"
│                 │  Trả false hoặc ném lỗi → DỪNG, controller không bao giờ chạy
└────────┬────────┘
         ▼
┌─────────────────┐
│  Pipe           │  "Dữ liệu gửi lên có đúng hình dạng không?"
│                 │  Sai → DỪNG với 400, kèm lỗi theo từng field
└────────┬────────┘
         ▼
┌─────────────────┐
│  Controller     │  Dịch HTTP thành một lời gọi hàm. Không chứa logic
└────────┬────────┘
         ▼
┌─────────────────┐
│  Service        │  Quy tắc nghiệp vụ. Không biết gì về HTTP
└────────┬────────┘
         ▼
┌─────────────────┐
│  PrismaService  │  Sinh câu SQL và gửi xuống Postgres
└────────┬────────┘
         ▼
     PostgreSQL
         │
         ▼
   JSON trả về
```

Và khi có lỗi ở **bất kỳ** mắt xích nào:

```
Guard / Pipe / Controller / Service  ──ném exception──▶  HttpExceptionFilter  ──▶  JSON lỗi
```

Hai điều đáng nhớ từ sơ đồ này:

1. **Guard và pipe chạy TRƯỚC controller.** Nên trong controller bạn không bao giờ phải viết
   `if (!user)` hay `if (!body.name)` — tới được đó nghĩa là đã qua cửa.
2. **Không chỗ nào tự dựng response lỗi.** Mọi nơi chỉ việc `throw`, exception filter lo phần còn
   lại. Nhờ vậy mọi lỗi của API có cùng một hình dạng.

Đi theo một request thật qua từng tầng: [Vòng đời một request](./12-api-request-lifecycle.md).

---

## MVC trong một API trả JSON

Nếu bạn từng học MVC, NestJS sẽ quen mắt ngay — chỉ khác một chỗ: API này không render HTML, nên
chữ "V" mang nghĩa khác.

| MVC cổ điển    | Trong `apps/api`            | Trách nhiệm                  |
| -------------- | --------------------------- | ---------------------------- |
| **Model**      | Service + Prisma            | Dữ liệu và quy tắc nghiệp vụ |
| **View**       | DTO trong `@repo/contracts` | Hình dạng JSON trả ra ngoài  |
| **Controller** | Controller                  | Ánh xạ URL ↔ lời gọi hàm     |

"View" ở đây là **hình dạng dữ liệu**, không phải template. `TaxonomyDto` chính là cái quyết định
người gọi nhìn thấy gì — đúng vai trò mà view đảm nhiệm trong web app truyền thống.

### Vì sao phải tách controller và service?

Lý do thực tế, không phải lý thuyết:

- **Service test được mà không cần HTTP.** Bạn `new CategoriesService(fakePrisma)` rồi gọi thẳng
  hàm. Không cần dựng server, không cần gửi request.
- **Một quy tắc nghiệp vụ chỉ nằm một chỗ.** `GET /categories` và một job chạy nền có thể cùng gọi
  `categories.list()`. Nếu quy tắc nằm trong controller, job đó phải chép lại.
- **Đổi HTTP không đụng tới nghiệp vụ.** Đổi URL, đổi tên query param — chỉ sửa controller.

---

## Dependency injection, nói cho đơn giản

Đây là khái niệm NestJS dùng nhiều nhất, và nó đơn giản hơn tên gọi rất nhiều.

```ts
// apps/api/src/categories/categories.service.ts
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
}
```

Bạn **không** viết `new PrismaService()` ở đâu cả. Bạn chỉ khai báo trong constructor: "tôi cần một
`PrismaService`". Lúc khởi động, Nest đọc kiểu dữ liệu đó, tự tạo một instance (chỉ một, dùng chung
cho cả ứng dụng) và truyền vào.

`@Injectable()` là nhãn báo "class này có thể được đưa vào chỗ khác". Thiếu nó, Nest báo lỗi lúc
khởi động khi có ai đó cần class này.

`private readonly` là cú pháp rút gọn của TypeScript: vừa khai báo tham số, vừa gán vào
`this.prisma`. Viết dài ra sẽ là:

```ts
private readonly prisma: PrismaService;

constructor(prisma: PrismaService) {
  this.prisma = prisma;
}
```

**Vì sao phải vòng vèo thay vì `new`?** Vì lúc viết test, bạn truyền vào một `PrismaService` giả mà
không cần database nào cả:

```ts
// apps/api/tests/products.service.test.ts
const prisma = { products: { findMany, count, findFirst } };
const service = new ProductsService(prisma as never);
```

Nếu service tự `new PrismaService()` bên trong, không cách nào thay thế được.

---

## Bạn đã học được gì

- API sở hữu quy tắc nghiệp vụ, phân quyền và database; BFF sở hữu trạng thái giao diện
- Một request đi qua **guard → pipe → controller → service → Prisma**, lỗi ở bất kỳ đâu rơi vào
  exception filter
- "View" trong API này là DTO — hình dạng JSON, không phải template
- Tách controller/service để test được không cần HTTP và để một quy tắc chỉ nằm một chỗ
- Dependency injection chỉ là: khai báo thứ bạn cần trong constructor, Nest tự truyền vào

## Đọc tiếp

- [Cấu trúc thư mục API](./11-api-structure.md) — file mới đặt ở đâu
- [Vòng đời một request](./12-api-request-lifecycle.md) — đi theo `GET /categories` từ đầu tới cuối
- [Truy cập dữ liệu](./13-api-data-access.md) — Prisma và tầng service
