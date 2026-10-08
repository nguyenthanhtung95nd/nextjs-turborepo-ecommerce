# Luồng dữ liệu ADMIN

Hướng dẫn này đi theo **một thao tác duy nhất** — mở `/products` rồi lọc sang trạng thái
`PUBLISHED` — từ lúc gõ URL cho tới lúc dòng dữ liệu hiện ra trên bảng. Rồi đi ngược lại một thao
tác ghi.

**Sau khi đọc xong bạn sẽ:** sửa được tầng dữ liệu của bất kỳ màn hình nào trong `apps/admin`.

## Trước khi bắt đầu

- Đã đọc [ADMIN làm gì](./20-admin-overview.md) — tài liệu này giả định bạn đã thấy sơ đồ ba tầng
- Hệ thống chạy được: `pnpm dev`

---

## Bước 1 — Route handler: tầng BFF, dài 12 dòng

Trình duyệt gọi `GET /api/products?status=PUBLISHED`. File được chạy là:

```ts
// apps/admin/src/app/api/products/route.ts
import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

export async function GET(request: NextRequest) {
  return proxy(`/products?${request.nextUrl.searchParams.toString()}`);
}

export async function POST(request: NextRequest) {
  return proxy("/products", "POST", await request.json());
}
```

Tên hàm export chính là HTTP method: `GET`, `POST`, `PATCH`, `DELETE`. Không có file định tuyến
nào khác.

Query string được chuyển tiếp **nguyên vẹn**. Đây là chủ ý: API sở hữu danh sách tham số hợp lệ và
quy tắc fallback khi tham số sai. Parse lại ở đây là có hai nơi trả lời cùng một câu hỏi, và sớm
muộn chúng trả lời khác nhau.

Toàn bộ 22 route handler đều mỏng như vậy vì công việc thật nằm trong một hàm dùng chung:

```ts
// apps/admin/src/services/api-proxy.ts
export async function callApi<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const token = await sessionToken(); // đọc cookie httpOnly
  if (!token) throw new ApiError(401, "Sign in to continue.");
  return apiFetch<T>(path, { method, body, token }); // gắn Authorization: Bearer
}
```

**Đó là toàn bộ việc của tầng BFF: đổi cookie lấy token.** Không một quy tắc nghiệp vụ nào ở đây:

```bash
grep -rn "prisma" apps/admin/src/app/api   # không in ra gì
```

`proxy()` bọc thêm phần xử lý lỗi, để mọi endpoint hỏng theo cùng một hình dạng:

```ts
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.message, error.fieldErrors);
  }
  if (error instanceof ApiUnavailableError) {
    console.error("[api-proxy] API unreachable", error);
    return errorResponse(503, "The service is temporarily unavailable.");
  }
  console.error("[api-proxy] unexpected failure", error);
  return errorResponse(500, "Something went wrong.");
}
```

Chi tiết lỗi được `console.error` ở **server**, client chỉ nhận một câu chung. Stack trace không
bao giờ đi ra ngoài.

---

## Bước 2 — `services.ts`: gọi và nắn dữ liệu

Trình duyệt không gọi `axios` rải rác trong component. Mỗi domain có một file `services.ts` tập
trung mọi lời gọi:

```ts
// apps/admin/src/features/products/services.ts
export async function fetchProducts(params: ProductListParams): Promise<ProductListResult> {
  const { data } = await apiClient.get<PageDto<ProductCardDto>>(`/products?${toQuery(params)}`);

  return {
    rows: data.items.map((item) => ({
      id: item.id,
      name: item.name,
      priceCents: item.priceCents,
      status: item.status,
      thumbnailUrl: item.imageUrl,
      updatedAt: new Date(item.updatedAt), // ← chuỗi ISO → Date
      // ...
    })),
    total: data.total,
    page: data.page,
    pageCount: data.pageCount,
  };
}
```

Hàm này làm hai việc, và việc thứ hai là lý do nó tồn tại:

1. Gọi route handler.
2. **Nắn lại dữ liệu cho màn hình.** JSON không có kiểu `Date` — `updatedAt` đi qua dây là một
   chuỗi. Không `new Date(...)` ở đây thì bảng nhận một chuỗi trông giống ngày, và
   `.toLocaleDateString()` sẽ nổ ở một chỗ cách xa nguyên nhân.

Kiểu trả về cũng là kiểu của **màn hình** (`ProductRow`), không phải kiểu của API
(`ProductCardDto`). Nhờ vậy khi API đổi tên một field, chỗ phải sửa là một dòng map ở đây.

`apiClient` có `baseURL: "/api"`, nên `"/products"` ở đây là route handler ở Bước 1, không phải
NestJS.

---

## Bước 3 — React Query: đọc dữ liệu

Component không tự gọi `fetchProducts`. Nó gọi một hook:

```ts
// apps/admin/src/features/products/api/use-products.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services";

export const productListKey = (params: ProductListParams) => ["products", "list", params] as const;

export function useProducts(params: ProductListParams) {
  return useQuery({ queryKey: productListKey(params), queryFn: () => fetchProducts(params) });
}
```

Bốn dòng, nhưng nó mang lại bốn thứ mà `useEffect` + `useState` không có:

| Thứ | Nghĩa là gì |
| --- | --- |
| **Cache theo `queryKey`** | Mỗi bộ lọc là một mục cache riêng. Quay lại bộ lọc đã xem → hiện ngay, không gọi lại |
| **Trạng thái sẵn có** | `isPending`, `isError`, `data` — không phải tự giữ ba `useState` |
| **Gộp request trùng** | Hai component cùng hỏi một `queryKey` → chỉ một request đi ra |
| **Thử lại có chọn lọc** | Xem `shouldRetry` bên dưới |

**`queryKey` là hợp đồng.** Nó phải chứa **mọi** thứ ảnh hưởng tới kết quả. Ở đây là cả object
`params` — thiếu một trường thôi thì đổi trường đó sẽ hiển thị dữ liệu cũ của trường khác.

### Cấu hình chung đặt ở provider

```tsx
// apps/admin/src/providers/query-provider.tsx
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: STALE_TIME_MS, retry: shouldRetry } },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Hai quyết định đáng chú ý:

- **`shouldRetry` không thử lại 4xx.** Một 403 hay 404 nghĩa là server đã trả lời, và câu trả lời
  sẽ không đổi — thử lại chỉ làm người dùng chờ lâu hơn trước khi thấy thông báo họ cần thấy.
- **`useState(() => new QueryClient())`, không phải `new QueryClient()` ở module.** Tạo ở module
  thì trên server mọi người dùng dùng chung một cache — dữ liệu của người này rò sang người khác.

---

## Bước 4 — Màn hình: bốn trạng thái

```tsx
// apps/admin/src/features/products/components/products-screen.tsx
"use client";

export function ProductsScreen({ canCreate, canUpdate, canDelete }: Props) {
  const searchParams = useSearchParams();
  const params = productListParamsSchema.parse(Object.fromEntries(searchParams));

  const products = useProducts(params);

  if (products.isPending) return <ProductsSkeleton />;

  return (
    <div className={TABLE_SURFACE}>
      {products.isError ? (
        <StatePanel title="Couldn't load products" /* ... */ />
      ) : products.data.rows.length === 0 ? (
        <ProductsEmptyState params={params} canCreate={canCreate} />
      ) : (
        <ProductTable rows={products.data.rows} /* ... */ />
      )}
    </div>
  );
}
```

**Bốn trạng thái, không phải một.** Đang tải → skeleton. Lỗi → panel có nút thử lại. Rỗng → trạng
thái rỗng có hướng dẫn. Có dữ liệu → bảng. Màn hình nào thiếu một trong bốn cái là màn hình chưa
xong.

---

## Bước 5 — URL giữ bộ lọc, không phải `useState`

```tsx
const searchParams = useSearchParams();
const params = productListParamsSchema.parse(Object.fromEntries(searchParams));
```

Bộ lọc **không** nằm trong `useState`. Nó nằm trong URL, và màn hình **suy ra** từ URL.

| Nếu dùng `useState` | Vì URL là nguồn sự thật |
| --- | --- |
| Gửi link cho đồng nghiệp → họ thấy danh sách chưa lọc | Link mang theo bộ lọc |
| F5 → mất bộ lọc | F5 giữ nguyên |
| Nút back không quay lại bộ lọc trước | Back hoạt động đúng |
| Phải tự đồng bộ state với `queryKey` | `params` vừa là URL vừa là `queryKey` |

Đổi bộ lọc là điều hướng, không phải `setState`:

```tsx
router.push(productsHref(params, { status: "PUBLISHED", page: 1 }));
```

`push` chứ không phải `replace` — để mỗi lần lọc là một bước lịch sử mà back quay lại được. Ngoại
lệ là ô tìm kiếm: nó debounce theo từng lần gõ, nên dùng `replace` để mười lần gõ không thành mười
bước back.

`productsHref` nằm trong `features/products/url.ts` và lược bỏ tham số mang giá trị mặc định, nên
URL ở trạng thái không lọc vẫn sạch (`/products`, không phải
`/products?status=ALL&sort=newest&page=1`).

---

## Bước 6 — Ghi dữ liệu: `useMutation` và vô hiệu hoá cache

```ts
// apps/admin/src/features/products/api/use-product-writes.ts
"use client";

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["products"] });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductFormInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: invalidate });
}
```

Phần quan trọng nhất là `onSuccess: invalidate`. Sau khi ghi thành công, cache cũ đã sai — không
vô hiệu hoá thì người dùng xoá một sản phẩm và vẫn thấy nó trong bảng.

`invalidateQueries({ queryKey: ["products"] })` dùng **tiền tố**: nó quét sạch mọi key bắt đầu
bằng `products` — danh sách, số đếm theo trạng thái, panel dashboard. Liệt kê từng key là thêm một
thứ phải nhớ cập nhật mỗi lần có màn hình mới.

Component gọi nó như một hàm thường:

```tsx
export function ProductCreateScreen() {
  const router = useRouter();
  const create = useCreateProduct();

  async function save(input: ProductFormInput): Promise<ProductResult> {
    try {
      await create.mutateAsync(input);
    } catch (error) {
      return toProductFailure(error, "product:create");
    }
    router.push(PRODUCTS_ROUTE);
    return { ok: true };
  }

  return <ProductForm defaults={BLANK_PRODUCT} submitLabel="Create product" action={save} />;
}
```

> **`mutate` hay `mutateAsync`?** `mutate` không ném lỗi, lỗi phải bắt qua callback `onError`.
> `mutateAsync` trả về Promise nên bắt được bằng `try/catch` — tiện khi form cần trả về kết quả
> cho chính nó, như ở đây.

---

## Bước 7 — Lỗi đi qua ba lần dịch

Một sản phẩm trùng `slug`. NestJS trả `409 Conflict`. Thông điệp đó đi qua ba chặng:

```
NestJS  409 {"statusCode":409,"message":"slug already in use"}
   │
   ▼  api-proxy.toErrorResponse       giữ nguyên status, log phía server
   │
   ▼  api-client interceptor          AxiosError  →  ApiError
   │
   ▼  features/products/errors.ts     ApiError    →  câu người dùng đọc được
   │
   ▼  form hiển thị lỗi ngay dưới ô "slug"
```

Chặng thứ hai tồn tại để phần còn lại của app chỉ phải biết **một** lớp lỗi:

```ts
// apps/admin/src/services/api-client.ts
apiClient.interceptors.response.use(undefined, (error: AxiosError<ApiErrorBody>) => {
  const response = error.response;
  if (!response) throw new ApiUnavailableError(error); // mất mạng, API chết

  const body = response.data;
  throw new ApiError(
    response.status,
    body?.message ?? "Something went wrong.",
    body?.errors ?? undefined,
  );
});
```

Chặng thứ ba là nơi mã số trở thành câu tiếng người:

```ts
// apps/admin/src/features/products/errors.ts
export function toProductFailure(error: unknown, operation: ProductOperation): ProductResult {
  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: DENIED_MESSAGES[operation] };
    if (error.status === 404) return { ok: false, error: "That product no longer exists." };
    if (error.status === 409) {
      return error.message.includes("slug")
        ? { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: { slug: error.message } }
        : { ok: false, error: error.message };
    }
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors };
    }
  }
  console.error("[products] write failed", error);
  return { ok: false, error: "Couldn't save the product. Please try again." };
}
```

Hàm này **thuần** — không gọi mạng, không đụng state. Nhờ vậy nó test được bằng một dòng, và một
lỗi 409 đọc giống hệt nhau ở mọi màn hình.

---

## Bước 8 — Đăng nhập và cổng kiểm tra phiên

Form đăng nhập POST tới route handler của chính app, không tới API:

```ts
// apps/admin/src/app/api/session/route.ts
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email?.trim() || !password) return failure(400, "Enter your email and password.");

  try {
    await signIn("credentials", { email: email.trim(), password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return failure(401, "Invalid email or password.");
    throw error;
  }

  return new NextResponse(null, { status: 204 });
}
```

`signIn` đặt cookie `httpOnly`. Mật khẩu và token **chưa bao giờ** đi qua JavaScript của trình
duyệt. Mọi nguyên nhân thất bại đều trả cùng một câu — để form không trở thành công cụ dò xem
email nào có tồn tại.

Sau khi vào, layout của route group `(app)` là cổng chạy trước mọi trang:

```tsx
// apps/admin/src/app/(app)/layout.tsx — Server Component
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const status = await checkSession(session);
  if (status === "unreachable") return <ServiceUnavailable />;
  if (status === "inactive") {
    return <Forbidden email={session.user.email ?? ""} reason="deactivated" />;
  }

  const permissions = session.user.permissions;
  if (permissions.length === 0) return <Forbidden email={session.user.email ?? ""} />;

  const nav = NAV_ITEMS.filter((i) => i.permission === null || permissions.includes(i.permission));
  return <AppShell user={...} nav={nav}>{children}</AppShell>;
}
```

**Ba trạng thái, không phải hai.** Một tài khoản bị vô hiệu hoá và một API đang chết trông giống
nhau từ phía client, nhưng cách xử lý khác hẳn: một cái cần gặp quản trị viên, một cái chỉ cần
chờ. Gộp chúng lại là gửi người dùng tới đúng người không giúp được gì.

`checkSession` hỏi database qua API chứ không tin token, vì việc vô hiệu hoá xảy ra **sau** khi
token đã được phát và không với tới được một JWT đã ký.

---

## Kiểm tra

Mở ADMIN, đăng nhập, vào `/products`, rồi mở DevTools:

**1. Token không ở trong JavaScript**

```js
document.cookie;
// → ""
```

**2. Trình duyệt chỉ gọi cổng 3001, không bao giờ gọi 3002**

Tab Network, lọc `Fetch/XHR`, rồi đổi bộ lọc trạng thái:

```
GET http://localhost:3001/api/products?status=PUBLISHED&...     200
```

Không có dòng nào tới `:3002`.

**3. Đổi bộ lọc không tải lại trang (đúng nghĩa SPA)**

```js
window.__marker = "còn sống";
// đổi bộ lọc, bấm back, rồi gõ lại:
window.__marker;
// → "còn sống"    (nếu trang tải lại, biến này đã biến mất)
```

**4. Cache hoạt động**

Đổi sang `PUBLISHED`, rồi bấm back. Danh sách cũ hiện **ngay lập tức** và tab Network không có
request mới — đó là `queryKey` cũ còn trong cache.

---

## Bạn đã học được gì

- Route handler chỉ đổi cookie lấy token; không quy tắc nghiệp vụ nào ở đó
- `services.ts` nắn dữ liệu API thành kiểu của màn hình — `Date` được hồi sinh ở đây
- `queryKey` là hợp đồng cache: thiếu một tham số là hiển thị sai
- Màn hình phải có đủ bốn trạng thái
- URL là nguồn sự thật của bộ lọc; `push` cho bộ lọc, `replace` cho ô tìm kiếm debounce
- `useMutation` phải `invalidateQueries` theo tiền tố, nếu không bảng hiện dữ liệu cũ
- Lỗi được dịch ba lần, và chi tiết chỉ được log ở server
- Cổng phiên phân biệt ba trạng thái: active, inactive, unreachable

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| `You're importing a component that needs useState` | Dùng hook trong Server Component | Thêm `"use client"` vào đúng file lá đó |
| `NAV_ITEMS.filter is not a function` | Server Component import giá trị từ module `"use client"` | Tách hằng số ra module không đánh dấu client |
| Xoá xong vẫn thấy dòng cũ trong bảng | `useMutation` thiếu `onSuccess: invalidate` | Vô hiệu hoá theo tiền tố `["<domain>"]` |
| Đổi bộ lọc nhưng dữ liệu không đổi | Thiếu tham số đó trong `queryKey` | Đưa cả object `params` vào key |
| 401 ở mọi request dù đã đăng nhập | `withCredentials` thiếu, hoặc `baseURL` trỏ sang origin khác | `baseURL: "/api"` + `withCredentials: true` |
| F5 là mất bộ lọc | Bộ lọc nằm trong `useState` | Chuyển sang `searchParams` + `router.push` |
| `Server Actions must be async functions` | Export không `async` trong file `"use server"` | Không dùng `"use server"` trong ADMIN |

## Đọc tiếp

- [Cấu trúc thư mục ADMIN](./21-admin-structure.md) — file mới đặt ở đâu
- [Thêm một màn hình](./23-admin-add-a-screen.md) — công thức đầy đủ
- [Xác thực và phân quyền](./14-api-authentication.md) — phía API của cùng câu chuyện
