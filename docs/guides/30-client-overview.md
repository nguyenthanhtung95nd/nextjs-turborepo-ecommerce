# CLIENT làm gì

`apps/client` là storefront cho khách hàng, chạy ở cổng 3000. Nó **server-first**: HTML được render
trên server rồi mới gửi đi, và phần lớn trang được dựng sẵn từ trước.

**Sau khi đọc xong bạn sẽ:** hiểu vì sao storefront chọn ngược hẳn với ADMIN, và biết ba cơ chế
render của Next.js mà nó dùng.

## Trước khi bắt đầu

- Biết React cơ bản
- Nên đọc [Kiến trúc](./00-architecture.md) để biết ba service chia việc thế nào

---

## Vì sao server-first

Storefront sống hay chết nhờ hai thứ mà ADMIN không cần:

| | Vì sao quan trọng với storefront |
| --- | --- |
| **SEO** | Người mua tìm sản phẩm qua Google. Trang chỉ render sau khi JavaScript chạy thì phần lớn crawler thấy một trang rỗng |
| **Lần tải đầu** | Khách vào từ một quảng cáo và rời đi sau 2 giây chờ. HTML dựng sẵn hiện ngay, không cần chờ tải bundle rồi mới fetch |

ADMIN ngược lại: không cần SEO (phải đăng nhập mới vào được), và người dùng ở trong app hàng chục
phút nên chi phí tải đầu không đáng kể so với tốc độ thao tác. Vì vậy nó chọn SPA. Xem
[ADMIN làm gì](./20-admin-overview.md).

**Cả hai vẫn là BFF.** Token nằm trong cookie `httpOnly` ở cả hai app; khác nhau là ai gọi API.

```
CLIENT:   Trình duyệt → HTML đã render sẵn
                         ▲
                         │ Server Component gọi apiFetch
                      Server Next :3000  →  API :3002

ADMIN:    Trình duyệt → React Query → route handler :3001 → API :3002
```

CLIENT chỉ có **1 route handler** (`api/auth/[...nextauth]`), vì trình duyệt của nó gần như không
gọi gì cả.

---

## Ba cơ chế render

Next.js quyết định dựng HTML lúc nào dựa trên thứ trang đó cần. Storefront dùng cả ba.

| Cơ chế | Dựng lúc nào | Trang nào dùng |
| --- | --- | --- |
| **Prerender lúc build** | Khi `pnpm build` chạy | `/products/[slug]` — qua `generateStaticParams` |
| **ISR** (dựng lại định kỳ) | Mỗi `revalidate` giây, ở request đầu sau khi hết hạn | Trang chủ, trang chi tiết, `sitemap.xml` |
| **Render động** | Mỗi request | `/products` có bộ lọc, `/search`, `/account` |

### Prerender: dựng sẵn mọi trang sản phẩm

```ts
// apps/client/src/app/products/[slug]/page.tsx
export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}
```

Lúc build, Next hỏi hàm này "có những slug nào?" rồi render sẵn từng trang. Đây là lý do
`pnpm build` **cần API đang chạy**.

`dynamicParams` để mặc định (bật), nên một sản phẩm publish sau khi build vẫn render được ở lần
truy cập đầu rồi được cache từ đó.

### ISR: dựng lại sau mỗi 60 giây

```ts
export const revalidate = 60;
```

Trang đã dựng sẵn sẽ không bao giờ tự đổi. Nếu không có dòng này, một lần đổi giá trong ADMIN sẽ
không tới được người mua cho tới lần deploy kế tiếp — và giá là đúng thứ không được phép cũ.

Cơ chế: request đầu tiên sau khi hết 60 giây vẫn được phục vụ **bản cũ**, đồng thời Next dựng lại
ở nền. Người dùng không bao giờ phải chờ.

Tầng dữ liệu đặt cùng cửa sổ đó cho từng lời gọi API:

```ts
// apps/client/src/lib/catalog/queries.ts
return apiFetch<PageDto<ProductCardDto>>(`/products${toQuery(params)}`, {
  next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
});
```

`tags` cho phép xoá cache theo nhóm mà không cần đợi hết hạn.

### Render động

Trang phụ thuộc `searchParams` (bộ lọc, tìm kiếm) hoặc phụ thuộc phiên đăng nhập (`/account`)
không dựng sẵn được — mỗi người xem một kết quả khác nhau. Chúng render ở mỗi request.

Số đo: trang chủ trong ISR cache trả về trong **4.5 ms**, còn trang `/products` có filter mất
**13.7 ms** vì nó luôn gọi API. Xem [Kiến trúc](./00-architecture.md).

---

## SEO được dựng từ database

Ba thứ, không thứ nào viết tay:

### `generateMetadata` — thẻ title và description cho từng trang

```ts
// apps/client/src/app/products/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  // ...
}
```

Hàm này và component của trang cùng gọi `getProductBySlug`, nhưng hàm đó được bọc trong `cache`
của React nên **hai lời gọi chỉ thành một truy vấn**.

### `sitemap.ts` — danh sách mọi URL đáng lập chỉ mục

```ts
// apps/client/src/app/sitemap.ts
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, facets] = await Promise.all([listSitemapProducts(), listFilterOptions()]);
  // ...
}
```

Sinh từ database chứ không duy trì bằng tay: một sản phẩm vừa publish sẽ xuất hiện ở lần
revalidate kế tiếp, một sản phẩm bị archive sẽ biến mất. Sitemap viết tay là một danh sách 404
đang chờ xảy ra.

Chỉ sản phẩm `PUBLISHED` được liệt kê — mọi truy vấn ở đây đi qua đúng bộ lọc mà storefront dùng.
Đưa URL của một bản nháp lên sitemap là làm lộ tên sản phẩm chưa ra mắt, dù trang đó vẫn 404.

### `robots.ts` — trang nào không nên lập chỉ mục

```ts
// apps/client/src/app/robots.ts
disallow: ["/account", "/login", "/register", "/search", "/api/"];
```

Không phải vì bí mật — `/account` đã nằm sau phiên đăng nhập. Mà vì không tiêu crawl budget vào
trang không bao giờ xếp hạng được, và không để `/search` lấp đầy chỉ mục bằng một URL cho mỗi từ
khoá từng có người gõ.

---

## Ghi dữ liệu: server action

CLIENT **có** dùng server action, khác ADMIN:

```ts
// apps/client/src/lib/account/actions.ts
"use server";

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult<...>> {
  // ...
  revalidatePath(ACCOUNT_ROUTE);
}
```

Hợp lý ở đây vì app đã server-first: form submit thẳng tới server, và `revalidatePath` là cách
làm mới dữ liệu khi không có cache phía client nào để vô hiệu hoá.

ADMIN không dùng vì nó đã có 22 route handler; thêm server action là thêm một bề mặt song song.

---

## Bạn đã học được gì

- Storefront server-first vì SEO và lần tải đầu; ADMIN là SPA vì tốc độ thao tác
- Cả hai vẫn là BFF — khác nhau là ai gọi API, không phải ai giữ token
- `generateStaticParams` dựng sẵn trang lúc build (nên build cần API chạy)
- `revalidate` giữ trang dựng sẵn không bị cũ; bản cũ vẫn được phục vụ trong lúc dựng lại
- Trang phụ thuộc `searchParams` hoặc phiên thì luôn render động
- `generateMetadata`, `sitemap.ts`, `robots.ts` đều sinh từ database

## Đọc tiếp

- [Cấu trúc thư mục CLIENT](./31-client-structure.md) — file mới đặt ở đâu
- [Lấy dữ liệu trong CLIENT](./32-client-data-fetching.md) — `apiFetch`, cache, xử lý 404
- [ADMIN làm gì](./20-admin-overview.md) — app còn lại chọn ngược lại, và vì sao
