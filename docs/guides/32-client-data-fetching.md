# Lấy dữ liệu trong CLIENT

Hướng dẫn này đi qua cách storefront lấy dữ liệu từ API trong Server Component, và vì sao nó nắn
lại dữ liệu thay vì hiển thị thẳng.

> **ADMIN đi đường khác.** Nó là SPA: dữ liệu được lấy trong trình duyệt qua React Query, và lời
> gọi đi qua route handler của chính nó. Xem [Luồng dữ liệu ADMIN](./22-admin-data-flow.md).

**Mục tiêu:** đọc hiểu và sửa được tầng dữ liệu của storefront.

## Trước khi bắt đầu

- Đã đọc [CLIENT làm gì](./30-client-overview.md)
- API chạy được — xem [Chạy hệ thống trên máy local](./01-getting-started.md)

## Quy tắc không được phá

**Token không bao giờ xuống JavaScript của trình duyệt.** Nó nằm trong cookie `httpOnly` do server
giữ, nên chỉ code phía server mới gắn được header `Authorization`.

Trong CLIENT, điều đó nghĩa là chỉ Server Component và server action gọi `apiFetch`; component có
`"use client"` nhận dữ liệu qua props từ component server cha.

ADMIN giữ đúng quy tắc trên bằng cách khác: trình duyệt gọi route handler cùng origin, và route
handler mới là nơi đổi cookie lấy token.

## Bước 1 — `apiFetch`

Mọi lời gọi đều đi qua một hàm duy nhất trong `packages/api-client`:

```ts
import { apiFetch } from "@repo/api-client";

const page = await apiFetch<PageDto<ProductCardDto>>("/products?sort=newest");
```

Hàm này lo bốn việc:

| Việc              | Chi tiết                                                     |
| ----------------- | ------------------------------------------------------------ |
| Base URL          | Đọc từ biến môi trường `API_URL`                             |
| Xác thực          | Gắn `Authorization: Bearer` khi được truyền token            |
| Lỗi               | Biến mọi phản hồi không phải 2xx thành `ApiError`            |
| Timeout           | Bỏ cuộc sau 10 giây thay vì treo vô hạn                      |

Hai loại lỗi nó ném ra:

```ts
ApiError            // API trả lời, nhưng là 4xx hoặc 5xx. Có .status và .fieldErrors
ApiUnavailableError // API không trả lời: sập, không tới được, hoặc chậm quá timeout
```

## Bước 2 — Cache

`apiFetch` chuyển `next` thẳng xuống `fetch` của Next, nên cache đặt được theo từng resource:

```ts
// apps/client/src/lib/catalog/queries.ts
const REVALIDATE_SECONDS = 60;

function listProductPage(params: Partial<CatalogListParams>, tag: string) {
  return apiFetch<PageDto<ProductCardDto>>(`/products${toQuery(params)}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
  });
}
```

`revalidate` giới hạn độ cũ của dữ liệu. `tags` cho phép sau này xoá cache theo nhóm mà không cần
đợi hết hạn.

## Bước 3 — Nắn dữ liệu cho màn hình

Đây là phần làm nên một BFF. API trả về hình dạng generic; app nắn lại theo nhu cầu của chính nó.

```ts
// API trả về
{ items: [...], total: 18, page: 1, pageCount: 2 }

// Trang listing của CLIENT cần
{ products: [...], total: 18, page: 1, pageCount: 2 }
```

```ts
export async function listProducts(params: CatalogListParams): Promise<CatalogPage> {
  const page = await listProductPage(params, "products");
  return { products: page.items, total: page.total, page: page.page, pageCount: page.pageCount };
}
```

Đổi tên một trường trông như việc thừa, nhưng nó giữ cho component UI không phụ thuộc vào hình
dạng của API. Khi API đổi, chỉ file này sửa.

Ghép nhiều endpoint cũng là việc của tầng này:

```ts
export const listFilterOptions = cache(
  async (): Promise<{ categories: FacetOption[]; brands: FacetOption[] }> => {
    const [categories, brands] = await Promise.all([listCategoryEntries(), listBrandEntries()]);
    return { categories, brands };
  },
);
```

`cache` của React gộp nhiều lời gọi giống nhau trong cùng một request thành một. Layout và page
cùng cần danh sách category, nhưng API chỉ bị hỏi một lần.

## Bước 4 — Xử lý lỗi

Hai loại lỗi, hai cách đối xử.

**404 là một câu trả lời, không phải sự cố.** Bắt nó và trả `null`:

```ts
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiFetch<ProductDetailDto>(`/products/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["products"] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
```

Page sau đó tự quyết định ý nghĩa của `null`:

```ts
const product = await getProductBySlug(slug);
if (!product) notFound();
```

**Mọi lỗi khác thì để nó ném lên.** Error boundary của Next sẽ bắt và hiển thị trạng thái lỗi kèm
nút thử lại. Đừng nuốt lỗi rồi trả mảng rỗng — người dùng sẽ thấy "không có sản phẩm nào" trong
khi sự thật là hệ thống đang hỏng.

Khi API sập hoàn toàn, màn hình hiện:

```
Something went wrong
The shop is having a problem. Please try again in a moment.
[ Try again ]
```

Không có stack trace, không có tên host, không có chi tiết nội bộ.

## Bước 5 — Dùng chung schema

Quy tắc validate sống trong `@repo/contracts` và được cả hai tầng dùng:

```ts
// Quy tắc validate: import thẳng từ contract, không re-export lại
import { catalogListParamsSchema, type CatalogSort } from "@repo/contracts";
```

```ts
// apps/client/src/lib/catalog/labels.ts
/** UI copy for the sort control. Wording belongs to the storefront, not to the shared contract. */
export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A–Z",
};
```

Chú ý thứ **không** đi vào contract: nhãn hiển thị. "Newest first" là chữ trên màn hình, không
phải quy tắc nghiệp vụ, nên nó ở lại app.

Validate hai lần không phải trùng lặp — cùng một schema. App validate để báo lỗi ngay không cần đi
vòng mạng; API validate vì nó là endpoint HTTP mà ai cũng gọi được.

## Bước 6 — Ghi dữ liệu bằng server action

Đọc đi qua `apiFetch` trong Server Component; ghi đi qua **server action** — một hàm chạy trên
server mà form gọi thẳng:

```ts
// apps/client/src/lib/auth/actions.ts
"use server";

export async function authenticate(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("next") ?? ""));

  if (!email || !password) return { error: "Enter your email and password.", values: { email } };

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password.", values: { email } };
    throw error;
  }

  return {};
}
```

Ba chi tiết đáng chú ý:

- **Nhận `FormData`**, nên form submit được cả khi JavaScript chưa tải xong
- **Mọi nguyên nhân thất bại trả cùng một câu**, để form không thành công cụ dò email nào tồn tại
- **`safeRedirect`** lọc tham số `next`, nếu không `?next=https://evil.example` biến trang đăng
  nhập thành bàn đạp chuyển hướng

Sau khi ghi, làm mới dữ liệu bằng `revalidatePath`:

```ts
// apps/client/src/lib/account/actions.ts
revalidatePath(ACCOUNT_ROUTE);
```

ADMIN không dùng server action — nó đã có route handler và React Query. Xem
[ADMIN làm gì](./20-admin-overview.md).

## Bẫy: vòng lặp redirect ở trang đăng nhập

Đây là lỗi dễ mắc nhất khi có hai tầng phiên. Khi một tài khoản bị khoá giữa phiên:

1. Cookie Auth.js **vẫn hợp lệ** — nó chỉ chứng minh ai đó từng đăng nhập
2. API trả 401 vì tài khoản đã khoá
3. `/account` thấy 401 → chuyển hướng tới `/login`
4. `/login` thấy cookie còn hợp lệ → "đã đăng nhập rồi" → chuyển ngược về `/account`
5. `ERR_TOO_MANY_REDIRECTS`

Nguyên nhân: trang đăng nhập hỏi sai câu. "Có cookie không?" không giống "phiên này còn dùng
được không?".

```tsx
// apps/client/src/app/login/page.tsx
// Only a session the API still accepts counts as signed in. A cookie that outlived its account
// would otherwise bounce between here and the page that rejected it.
if (session?.user && (await isSessionActive(session))) redirect(next);
```

`isSessionActive` hỏi API bằng `GET /auth/me` và chỉ trả `true` khi API còn chấp nhận token đó.

**Quy tắc: bất cứ trang nào chuyển hướng người đã đăng nhập đi nơi khác đều phải kiểm phiên còn
sống**, không chỉ kiểm cookie tồn tại.

> ADMIN giải quyết cùng vấn đề bằng `checkSession`, phân biệt thêm trạng thái thứ ba
> (`unreachable`) để một API đang chết không bị báo nhầm là tài khoản bị khoá. Xem
> [Luồng dữ liệu ADMIN](./22-admin-data-flow.md).

## Kiểm tra

Chạy CLIENT và mở một trang listing:

```bash
pnpm --filter client dev
curl -s "http://localhost:3000/products?category=displays&sort=price-asc" -o /dev/null -w "%{http_code}\n"
```

Tắt API rồi tải lại trang: phải thấy trạng thái lỗi có nút thử lại, không phải trang trắng.

## Bạn đã học được gì

- Trong CLIENT, chỉ code phía server gọi API; component client nhận dữ liệu qua props
- `apiFetch` là lối đi duy nhất, và nó lo base URL, token, lỗi, timeout
- App nắn dữ liệu API thành hình dạng màn hình cần — đó là công việc của tầng này
- 404 bắt và trả `null`; lỗi khác để ném lên cho error boundary
- Schema dùng chung, nhãn hiển thị thì không
- Ghi dữ liệu bằng server action nhận `FormData`, rồi `revalidatePath`
- Trang nào chuyển hướng người đã đăng nhập cũng phải kiểm phiên còn sống, không chỉ kiểm cookie

## Đọc tiếp

- [CLIENT làm gì](./30-client-overview.md) — ISR, prerender, SEO
- [Cấu trúc thư mục CLIENT](./31-client-structure.md) — file mới đặt ở đâu
- [Luồng dữ liệu ADMIN](./22-admin-data-flow.md) — cùng câu hỏi, phía SPA
