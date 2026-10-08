# Xác thực và phân quyền

Hướng dẫn này đi qua cách một người đăng nhập, token đi những đâu, và API quyết định ai được làm gì.

**Mục tiêu:** đọc hiểu và sửa được tầng xác thực, và biết vì sao từng lựa chọn lại như vậy.

## Trước khi bắt đầu

- Ba service chạy được — xem [Chạy hệ thống trên máy local](./01-getting-started.md)
- Đã đọc [Kiến trúc](./00-architecture.md), đủ để biết BFF là gì

## Quy tắc quan trọng nhất

**Trình duyệt không bao giờ giữ token.** Nó chỉ có một cookie `httpOnly` mà JavaScript không đọc
được. Token gọi API nằm *bên trong* cookie đó, do server Next giữ.

Kiểm chứng được ngay trên console của trình duyệt khi đã đăng nhập:

```js
document.cookie; // ""        — cookie httpOnly không hiện ra ở đây
localStorage; // trống
```

Đây là lý do mô hình này được khuyến nghị. Một lỗ XSS có thể làm nhiều thứ, nhưng không lấy được
token mà nó không nhìn thấy.

## Luồng token

```
1. Form đăng nhập  ──► server action  ──► Auth.js authorize()
2. authorize()     ──► POST /auth/login {email, password}
3. API verify bcrypt, đọc quyền từ DB, ký JWT
                   ──► { id, email, name, permissions, accessToken }
4. Auth.js cất accessToken vào cookie httpOnly
5. Mọi lời gọi BFF → API gửi  Authorization: Bearer <accessToken>
6. API: JwtAuthGuard xác thực  →  PermissionsGuard kiểm quyền
```

Hai token khác nhau, dễ nhầm:

| Token              | Ai ký     | Nằm ở đâu                   | Dùng để          |
| ------------------ | --------- | --------------------------- | ---------------- |
| Session cookie     | Auth.js   | Trình duyệt (`httpOnly`)    | Giữ phiên đăng nhập |
| `accessToken`      | API       | Bên trong session cookie    | Gọi API          |

Chúng ký bằng hai khoá khác nhau: `AUTH_SECRET` và `JWT_SECRET`. Tách ra để một khoá lộ không kéo
theo khoá kia.

## Bước 1 — API cấp token

`AuthService.login` xác thực rồi ký token:

```ts
// apps/api/src/auth/auth.service.ts
async login(input: LoginInput): Promise<AuthenticatedUserDto> {
  const user = await this.prisma.client.users.findUnique({ where: { email: input.email } });
  if (!user?.is_active) throw new UnauthorizedException(INVALID_CREDENTIALS);
  if (!(await bcrypt.compare(input.password, user.password_hash))) {
    throw new UnauthorizedException(INVALID_CREDENTIALS);
  }

  return this.issue(user.id, user.email, user.name);
}
```

Chú ý: **ba nguyên nhân thất bại khác nhau trả về cùng một thông báo** — email không tồn tại, sai
mật khẩu, tài khoản bị khoá. Phân biệt chúng biến endpoint này thành công cụ dò xem địa chỉ nào có
tài khoản.

Kiểm chứng:

```bash
curl -s -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@nowhere.test","password":"wrong"}'
```

```json
{ "statusCode": 401, "message": "Invalid email or password." }
```

Thử lại với email có thật nhưng sai mật khẩu — kết quả phải **giống hệt từng ký tự**.

## Bước 2 — JwtAuthGuard

Guard xác thực chữ ký rồi gắn người gọi vào request:

```ts
// apps/api/src/auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(request);
    if (!token) throw new UnauthorizedException("Sign in to continue.");

    request.user = await verify(this.jwt, this.auth, token);
    return true;
  }
}
```

Dùng nó bằng `@UseGuards`:

```ts
// apps/api/src/auth/auth.controller.ts
@Get("me")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
me(@Req() request: AuthedRequest) {
  return this.auth.currentUser(request.user!.id);
}
```

### Vì sao đọc database ở mỗi request

Hàm `verify` không chỉ kiểm chữ ký — nó còn gọi `currentUser`, và hàm đó đọc `is_active` cùng danh
sách quyền từ database.

Nghe như lãng phí một truy vấn. Nhưng JWT là **bất biến**: nó ghi lại tình trạng tại thời điểm
đăng nhập. Khoá một tài khoản hay gỡ một role sau đó **không thể** với tới token đã phát. Nếu chỉ
tin vào nội dung token, người bị khoá vẫn dùng được hệ thống cho tới khi token hết hạn — tức là 30
ngày.

Kiểm chứng: đăng nhập, rồi khoá tài khoản đó trong database, rồi tải lại trang.

```sql
UPDATE users SET is_active = false WHERE email = 'YOUR_TEST_EMAIL';
```

Request kế tiếp trả 401 dù cookie chưa đổi gì.

## Bước 3 — OptionalJwtGuard

Vài endpoint công khai nhưng **trả về nhiều hơn** khi người gọi có quyền. `GET /products` là ví
dụ: khách thấy hàng đã phát hành, nhân viên có `product:read` thấy cả bản nháp.

```ts
// apps/api/src/auth/jwt-auth.guard.ts
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(request);
    if (!token) return true;

    try {
      request.user = await verify(this.jwt, this.auth, token);
    } catch {
      // A bad token is treated as no token here: the endpoint is public either way.
    }
    return true;
  }
}
```

Controller đọc quyền rồi quyết định:

```ts
// apps/api/src/products/products.controller.ts
function canSeeAllStatuses(request: AuthedRequest): boolean {
  return request.user?.permissions.includes("product:read") ?? false;
}

@Get()
list(@Query() query: CatalogListQueryDto, @Req() request: AuthedRequest) {
  return this.products.listPublished(query, canSeeAllStatuses(request));
}
```

Và service là nơi quyết định có hiệu lực — người gọi không tự nới được:

```ts
// apps/api/src/products/products.service.ts
const status = canSeeAllStatuses && params.status ? { status: params.status } : PUBLISHED_ONLY;
```

Kiểm chứng:

```bash
# Không token: ?status=DRAFT bị bỏ qua
curl -s "http://localhost:3002/products?status=DRAFT" | head -c 80

# Có token mang product:read: trả về đúng bản nháp
curl -s "http://localhost:3002/products?status=DRAFT" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | head -c 80
```

## Bước 4 — @Permissions và PermissionsGuard

Khai báo quyền một route cần bằng decorator, kiểm bằng guard:

```ts
// apps/api/src/auth/permissions.guard.ts
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const granted = context.switchToHttp().getRequest<AuthedRequest>().user?.permissions ?? [];
    const missing = required.filter((permission) => !granted.includes(permission));

    if (missing.length > 0) throw new ForbiddenException("You do not have permission to do that.");
    return true;
  }
}
```

Dùng trên route:

```ts
@Delete(":id")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("product:delete")
remove(@Param("id") id: string) {
  return this.products.remove(id);
}
```

**Thứ tự quan trọng.** `JwtAuthGuard` phải đứng trước, vì nó là thứ đặt `request.user` mà
`PermissionsGuard` đọc. Đảo lại thì quyền luôn rỗng và mọi request đều 403.

Ẩn nút trên giao diện **không phải** là bảo vệ. Guard này chạy ở mọi request, kể cả khi người ta
gọi thẳng endpoint bằng curl.

## Bước 5 — Phía BFF nhận token thế nào

API dừng ở chỗ phát ra token. Phần còn lại thuộc về hai app Next:

```ts
// packages/auth/src/config.ts — Auth.js gọi API thay vì đọc database
authorize: async (credentials) => {
  try {
    const user = await apiFetch<AuthenticatedUserDto>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return { ...user, id: user.id };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    console.error("[auth] sign-in failed", error);
    return null;
  }
},
```

Callback `jwt` cất `accessToken` vào phiên, và `sessionToken()` lấy nó ra cho `apiFetch`. Trình
duyệt không bao giờ thấy chuỗi đó.

Chi tiết từng app: [ADMIN](./22-admin-data-flow.md) · [CLIENT](./32-client-data-fetching.md).
Danh sách export của `@repo/auth`: [Package dùng chung](./02-packages.md).

## Vì sao không có refresh token

Refresh token giải quyết bài toán: access token sống ngắn vì sợ bị lấy cắp, nên cần cách gia hạn
mà không bắt đăng nhập lại.

Ở đây token nằm trong cookie `httpOnly` do server giữ — trình duyệt không chạm tới. Vòng đời ngắn
không giải quyết thêm gì, nó chỉ thêm một luồng nữa phải hiểu và bảo trì.

Token sống cùng tuổi với phiên Auth.js (30 ngày). Hết hạn thì đăng nhập lại.

Khi nào thì cần thêm: có ứng dụng di động giữ token trong storage của thiết bị. Lúc đó vòng đời
ngắn thật sự giảm thiệt hại, và refresh token xứng đáng với độ phức tạp của nó.

## Kiểm tra

Sáu luồng đáng chạy tay sau mỗi lần sửa tầng này:

| Luồng | Kết quả đúng |
| --- | --- |
| Đăng nhập đúng | Vào được trang tài khoản |
| Sai mật khẩu | Một thông báo chung, không chỉ ra sai ở đâu |
| Đăng xuất | `/account` chuyển về `/login?next=%2Faccount` |
| Đổi mật khẩu | Mật khẩu cũ bị từ chối, mật khẩu mới đăng nhập được |
| Tài khoản bị khoá giữa phiên | Về form đăng nhập, **không** vòng lặp |
| Tài khoản không có role vào ADMIN | Trang Forbidden |

Kiểm tra token không rò rỉ, trên console của trình duyệt khi đã đăng nhập:

```js
document.cookie; // ""
```

## Bạn đã học được gì

- Trình duyệt giữ cookie, server giữ token — đó là điều làm nên BFF
- Một thông báo lỗi cho mọi nguyên nhân đăng nhập thất bại, để không lộ ai có tài khoản
- JWT là ảnh chụp lúc đăng nhập, nên quyền và trạng thái phải đọc lại từ database mỗi request
- `JwtAuthGuard` đặt người gọi lên request; `PermissionsGuard` đọc nó — sai thứ tự là 403 toàn bộ
- `OptionalJwtGuard` cho endpoint công khai nhưng trả nhiều hơn khi có quyền
- Không có refresh token, vì token không bao giờ rời khỏi server

## Đọc tiếp

- [Vòng đời một request](./12-api-request-lifecycle.md) — guard nằm ở đâu trong dây chuyền
- [ADMIN: luồng dữ liệu](./22-admin-data-flow.md) — cổng kiểm tra phiên phía back office
- [CLIENT: lấy dữ liệu](./32-client-data-fetching.md) — bẫy vòng lặp redirect ở trang đăng nhập
