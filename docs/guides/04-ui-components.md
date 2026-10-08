# Viết component cho `@repo/ui`

`packages/ui` chứa các **primitive** của design system: `Button`, `Input`, `Dialog`… Chúng là
những component không biết gì về nghiệp vụ, dùng chung cho cả ADMIN và CLIENT.

Tài liệu này giải thích vì sao chúng trông khác hẳn component bình thường trong `apps/*`, và cách
viết thêm một cái mới.

**Sau khi đọc xong bạn sẽ:** đọc được mọi file trong `packages/ui/src/components`, biết khi nào
dùng kiểu props nào, và tự thêm được một primitive.

## Trước khi bắt đầu

- Biết React cơ bản: component, props, JSX
- Biết TypeScript ở mức `interface` và generic đơn giản

---

## Bước 1 — Một primitive trông như thế nào

Đây là `Label`, file đơn giản nhất trong `packages/ui`, đủ cả 5 dòng:

```tsx
// packages/ui/src/components/label.tsx
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium leading-none", className)} {...props} />;
}
```

Bốn thứ đang diễn ra:

| Phần | Nghĩa |
| --- | --- |
| `ComponentProps<"label">` | Kiểu props = **mọi** thuộc tính hợp lệ của thẻ `<label>` |
| `{ className, ...props }` | Tách riêng `className` ra, gom phần còn lại vào `props` |
| `cn("...", className)` | Ghép class mặc định với class người gọi truyền vào |
| `{...props}` | Trả lại toàn bộ thuộc tính còn lại cho thẻ `<label>` |

Kết quả: `<Label htmlFor="email">Email</Label>` chạy đúng, và `<Label className="text-red-500">`
cũng chạy đúng.

---

## Bước 2 — Vì sao props không viết `interface Props { ... }`

Đây là câu hỏi hay gặp nhất, và câu trả lời quyết định bạn viết primitive như thế nào.

### `ComponentProps` là TypeScript, không phải "bỏ qua TypeScript"

`ComponentProps<"input">` là một kiểu do React cung cấp, nghĩa là *"toàn bộ props mà thẻ `<input>`
nhận"* — khoảng 250 thuộc tính, đã type sẵn. Nó **chặt hơn** một interface viết tay, không lỏng hơn.

### Thử viết tay xem hỏng ở đâu

Giả sử `Input` khai kiểu props thủ công:

```tsx
// Cách này KHÔNG dùng được cho một primitive
interface Props {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
```

Form đăng nhập trong ADMIN đang truyền bảy thuộc tính khác nhau:

```tsx
// apps/admin/src/features/auth/components/login-form.tsx
<Input
  id="email"
  name="email"
  type="email"
  required
  autoComplete="email"
  placeholder="you@company.com"
  aria-invalid={Boolean(error)}
  aria-describedby={error ? "sign-in-error" : undefined}
/>
```

Với interface ở trên, **cả tám dòng đều lỗi biên dịch**. Bạn sẽ phải bổ sung từng thuộc tính một,
mỗi lần có nhu cầu mới — và không bao giờ đuổi kịp HTML.

### Hai kiểu props, hai loại component

Dự án dùng **hai cách type props, có chủ đích**:

| Loại component | Kiểu props | Vì sao |
| --- | --- | --- |
| Primitive trong `packages/ui` | Suy ra: `ComponentProps<"input">` | Nó *là* một thẻ HTML được tô màu — hợp đồng của nó chính là hợp đồng của thẻ đó |
| Component nghiệp vụ trong `apps/*` | Viết tay: `interface Props { ... }` | Nó có hợp đồng riêng, và hợp đồng đó cần hẹp để người đọc biết nó cần gì |

Ví dụ phía nghiệp vụ, trong ADMIN:

```tsx
// apps/admin/src/features/products/components/product-status-badge.tsx
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}
```

Component này chỉ nhận đúng **một** prop. Nếu nó nhận cả `ComponentProps<"span">` thì người gọi
truyền được `onClick`, `style`, `title`… trong khi không cái nào có ý nghĩa ở đây.

> **Quy tắc:** càng gần DOM thì props càng rộng (suy ra); càng gần nghiệp vụ thì props càng hẹp
> (viết tay). Quy tắc "props là hợp đồng viết tay" trong `rules/methods-and-components.md` nói về
> loại thứ hai.

### Khi wrap một thư viện, suy ra từ chính nó

```tsx
// packages/ui/src/components/avatar.tsx
export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) { ... }
```

`typeof AvatarPrimitive.Root` lấy kiểu props của component Radix đang được bọc. Radix thêm prop
mới trong phiên bản sau thì kiểu ở đây tự cập nhật theo.

---

## Bước 3 — `cn`: vì sao không nối chuỗi class

```tsx
// packages/ui/src/lib/cn.ts
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

Nếu chỉ nối chuỗi, hai class Tailwind xung đột sẽ **cùng tồn tại** và kết quả phụ thuộc thứ tự
trong file CSS, không phải thứ tự bạn viết:

```tsx
// Nối chuỗi: cả hai cùng có mặt, không đoán được cái nào thắng
className={"px-4 " + className}       // người gọi truyền "px-8"  → "px-4 px-8"

// cn(): cái sau thắng, như bạn mong đợi
className={cn("px-4", className)}     // → "px-8"
```

`twMerge` biết `px-4` và `px-8` cùng điều khiển một thuộc tính nên loại cái trước. Đó là lý do
mọi primitive đều gọi `cn`, và đó cũng là thứ làm cho `className` của người gọi luôn ghi đè được.

---

## Bước 4 — `cva`: bảng biến thể

`Button` có 4 kiểu và 3 cỡ. Nếu viết bằng `if`, call site sẽ phải tự nhớ chuỗi class:

```tsx
// packages/ui/src/components/button.tsx
const buttonVariants = cva("inline-flex items-center justify-center rounded-md ...", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground hover:brightness-110",
      outline: "border border-border bg-background hover:bg-muted",
      ghost: "hover:bg-muted",
      destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
    },
    size: { default: "h-9 px-4 py-2", sm: "h-8 px-3", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});
```

Hai thứ nhận được:

1. **Call site chỉ viết tên biến thể:** `<Button variant="destructive" size="sm">`
2. **TypeScript tự biết tên nào hợp lệ** — nhờ `VariantProps<typeof buttonVariants>`:

```tsx
export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

`VariantProps` đọc ngược từ bảng ở trên và sinh ra
`{ variant?: "primary" | "outline" | "ghost" | "destructive"; size?: ... }`. Thêm một biến thể vào
bảng là kiểu tự có thêm — không có chỗ thứ hai phải sửa.

**Khi nào mới dùng `cva`:** từ **ba** biến thể trở lên. Một component chỉ có hai trạng thái thì
một `cn()` với điều kiện là đủ, và dễ đọc hơn.

---

## Bước 5 — `asChild`: giữ style, đổi thẻ

```tsx
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

`asChild` giải quyết một vấn đề rất cụ thể: **một thứ trông như nút bấm nhưng phải là link.**

```tsx
// apps/admin/src/components/service-unavailable.tsx
<Button asChild variant="outline">
  <Link href="/">Try again</Link>
</Button>
```

Không có `asChild`, bạn phải chọn: hoặc `<button onClick={() => router.push(...)}>` (hỏng điều
hướng bằng bàn phím, không mở được tab mới), hoặc `<a className="...">` với chuỗi class chép tay.

`Slot` của Radix nhận class của `Button` và **gắn lên chính `<Link>`**, nên HTML cuối cùng là một
thẻ `<a>` thật, mang đúng style của nút.

Radix cũng dùng cùng cơ chế đó cho trigger của mình:

```tsx
// apps/admin/src/components/app-shell.tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost">…</Button>
</DropdownMenuTrigger>
```

---

## Bước 6 — `ref` trong React 19

Nếu bạn xem code `shadcn/ui` cũ trên mạng, bạn sẽ thấy mọi component đều bọc trong `forwardRef`:

```tsx
// KIỂU CŨ — trước React 19. Không dùng trong dự án này nữa.
export const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("...", className)} {...props} />
  ),
);
Label.displayName = "Label";
```

Lý do tồn tại: trước React 19, `ref` **không** phải một prop bình thường — nó bị React giữ lại,
không đi vào `props`. Muốn người gọi chạm được vào thẻ DOM bên trong thì phải bọc `forwardRef` để
nhận `ref` qua tham số thứ hai.

React 19 bỏ hẳn ngoại lệ đó. Tài liệu chính thức viết:

> "Starting in React 19, you can now access `ref` as a prop for function components… **New
> function components will no longer need `forwardRef`** … In future versions we will **deprecate
> and remove** `forwardRef`."

Dự án chạy React 19.2.8, nên viết thẳng:

```tsx
// KIỂU MỚI — đang dùng
export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("...", className)} {...props} />;
}
```

`ref` vẫn hoạt động bình thường — nó nằm trong `...props` và được trả về cho `<label>` như mọi
thuộc tính khác. Không cần `displayName` nữa: React đọc tên hàm.

> **`shadcn/ui` cũng đã đổi.** Registry hiện tại của họ sinh ra hàm thường, không còn `forwardRef`.
> Nếu bạn copy code từ một bài blog cũ, hãy bỏ lớp `forwardRef` đi trước khi dán vào.

---

## Bước 7 — Thêm một primitive mới

Ví dụ: một `Switch` bọc Radix.

```tsx
// packages/ui/src/components/switch.tsx
"use client";

import type { ComponentProps } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/cn";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}
```

Rồi khai báo lối vào trong `package.json` — package này **không có barrel file**, mỗi component là
một subpath riêng để bundler loại được phần không dùng:

```json
{
  "exports": {
    "./switch": "./src/components/switch.tsx"
  }
}
```

```tsx
import { Switch } from "@repo/ui/switch";
```

### Khi nào `"use client"`

| Primitive | Cần `"use client"`? | Vì sao |
| --- | --- | --- |
| `Label`, `Input`, `Button`, `Badge` | Không | Chỉ render thẻ HTML, không giữ state |
| `Dialog`, `DropdownMenu`, `Sheet`, `Avatar` | **Có** | Radix dùng hook và event handler bên trong |

Đặt `"use client"` khi không cần làm component đó không dùng được trong Server Component của
CLIENT — đó là lý do `Button` cố ý **không** có dòng đó.

---

## Bước 8 — Thứ không được đặt vào `packages/ui`

`@repo/ui` không được biết sản phẩm, người dùng hay vai trò là gì. Thử nghiệm: nếu bạn mang package
này sang một dự án khác, nó phải dùng được ngay.

```tsx
// SAI — @repo/ui giờ biết "product status" là gì
export function ProductStatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) { ... }

// ĐÚNG — @repo/ui chỉ biết "tone"; app ánh xạ nghiệp vụ sang tone
// packages/ui: <Badge tone="success">
// apps/admin/src/features/products/components/product-status-badge.tsx:
const STATUS_TONES: Record<ProductStatus, "success" | "warning" | "muted"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "muted",
};
```

| Thuộc về `packages/ui` | Thuộc về `apps/*` |
| --- | --- |
| `Button`, `Input`, `Dialog`, `Badge` | `ProductStatusBadge`, `ProductCard`, `UserRow` |
| `tone="success"` | `status="PUBLISHED"` → `tone` |
| `formatMoney`, `pluralize` | `PRODUCT_STATUS_LABELS` |

---

## Kiểm tra

```bash
pnpm --filter @repo/ui typecheck
pnpm typecheck && pnpm lint && pnpm test
```

Rồi kiểm ba điều bằng mắt trong trình duyệt:

| Kiểm | Cách làm |
| --- | --- |
| `className` ghi đè được | Truyền `className="px-8"` cho `<Button>`, xem padding có đổi |
| Bàn phím dùng được | Tab tới component, Enter/Space kích hoạt, vòng focus nhìn thấy rõ |
| `asChild` ra đúng thẻ | Inspect `<Button asChild><Link/></Button>` → phải là `<a>`, không phải `<button>` |

---

## Bạn đã học được gì

- `ComponentProps<"input">` **là** TypeScript — nó lấy toàn bộ props của thẻ HTML, chặt hơn
  interface viết tay
- Primitive dùng props suy ra; component nghiệp vụ dùng `interface Props` viết tay
- `cn()` tồn tại để class của người gọi luôn thắng class mặc định
- `cva` biến danh sách biến thể thành kiểu TypeScript, dùng từ ba biến thể trở lên
- `asChild` + `Slot` cho phép giữ style của nút mà render ra thẻ `<a>` thật
- React 19 cho `ref` làm prop thường, nên **không dùng `forwardRef`** nữa
- `@repo/ui` không được biết gì về nghiệp vụ — app ánh xạ nghiệp vụ sang `tone`/`variant`

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| `Property 'autoComplete' does not exist` | Props viết tay thiếu thuộc tính HTML | Đổi sang `ComponentProps<"input">` |
| Truyền `className` nhưng không đổi gì | Nối chuỗi thay vì `cn()` | Bọc bằng `cn("mặc định", className)` |
| `You're importing a component that needs useState` | Primitive bọc Radix mà thiếu `"use client"` | Thêm vào đầu file đó |
| `<Button asChild>` render ra `<button>` lồng `<a>` | Quên `asChild` | Thêm `asChild`, và chỉ truyền **một** phần tử con |
| `ref` không tới được DOM | Có `{...props}` nhưng lại khai `ref` riêng rồi bỏ quên | Để `ref` đi theo `...props` |
| Thêm biến thể nhưng TypeScript không nhận | Khai class trong `cn()` thay vì trong bảng `cva` | Thêm vào `variants` của `cva` |

## Đọc tiếp

- [Package dùng chung](./02-packages.md) — `@repo/ui` nằm ở đâu trong hệ thống
- [Cấu trúc thư mục ADMIN](./21-admin-structure.md) — component nghiệp vụ đặt ở đâu
- [Cấu trúc thư mục CLIENT](./31-client-structure.md)
