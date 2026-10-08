# Tài liệu kỹ thuật

Mỗi file trả lời **một** câu hỏi. Số đầu tên file cho biết nhóm và thứ tự nên đọc:

| Khối | Nói về |
| --- | --- |
| `0x` | Nền tảng — chung cho cả ba project |
| `1x` | API — `apps/api`, NestJS |
| `2x` | ADMIN — `apps/admin`, Next.js SPA |
| `3x` | CLIENT — `apps/client`, Next.js server-first |

Trong mỗi nhóm project, thứ tự luôn là: **overview** (là gì, làm gì) → **structure** (code nằm ở
đâu) → phần còn lại (chạy thế nào).

---

## Nền tảng

| File | Trả lời |
| --- | --- |
| [00-architecture.md](./00-architecture.md) | Ba service chia việc thế nào? BFF là gì? Vì sao hai app render khác nhau? |
| [01-getting-started.md](./01-getting-started.md) | Làm sao chạy được cả ba service trên máy tôi? |
| [02-packages.md](./02-packages.md) | `@repo/*` nào chứa gì, khi nào import cái nào? |
| [03-add-a-feature.md](./03-add-a-feature.md) | Thêm một tính năng chạm cả ba project thì làm theo thứ tự nào? |
| [04-ui-components.md](./04-ui-components.md) | Primitive của design system viết thế nào? Vì sao props không dùng `interface Props`? |

## API — `apps/api` (NestJS, cổng 3002)

| File | Trả lời |
| --- | --- |
| [10-api-overview.md](./10-api-overview.md) | API chịu trách nhiệm gì? Request đi qua guard → pipe → controller → service → Prisma ra sao? |
| [11-api-structure.md](./11-api-structure.md) | Thư mục `apps/api` gồm gì? File mới đặt ở đâu? |
| [12-api-request-lifecycle.md](./12-api-request-lifecycle.md) | Đi theo `GET /categories` từ HTTP tới JSON |
| [13-api-data-access.md](./13-api-data-access.md) | Prisma hoạt động thế nào? Vì sao service trả DTO chứ không trả record? |
| [14-api-authentication.md](./14-api-authentication.md) | Token được cấp và kiểm ở đâu? Ba loại guard khác nhau chỗ nào? |
| [15-api-add-endpoint.md](./15-api-add-endpoint.md) | Thêm một endpoint mới |

## ADMIN — `apps/admin` (Next.js SPA, cổng 3001)

| File | Trả lời |
| --- | --- |
| [20-admin-overview.md](./20-admin-overview.md) | SPA nhưng vẫn là BFF nghĩa là gì? Server Component khác Client Component ra sao? |
| [21-admin-structure.md](./21-admin-structure.md) | `features/<domain>/` gồm gì? Khi nào mới cần `"use client"`? |
| [22-admin-data-flow.md](./22-admin-data-flow.md) | Một thao tác từ đầu tới cuối: route handler → services → React Query → mutation |
| [23-admin-add-a-screen.md](./23-admin-add-a-screen.md) | Thêm một màn hình mới |

## CLIENT — `apps/client` (Next.js server-first, cổng 3000)

| File | Trả lời |
| --- | --- |
| [30-client-overview.md](./30-client-overview.md) | Vì sao storefront render ở server? SEO, ISR, prerender |
| [31-client-structure.md](./31-client-structure.md) | `components/` + `lib/` · ba bẫy App Router |
| [32-client-data-fetching.md](./32-client-data-fetching.md) | `apiFetch` trong Server Component, cache, xử lý 404, server action |

---

## Đọc theo mục tiêu

| Tôi muốn… | Đọc theo thứ tự |
| --- | --- |
| Chạy được hệ thống lần đầu | `01` → `00` |
| Hiểu toàn hệ thống trước khi sửa gì | `00` → `10` → `20` → `30` |
| Học NestJS từ đầu | `10` → `11` → `12` → `13` → `14` |
| Học Next.js App Router từ đầu | `20` → `21` → `22`, rồi `30` → `31` → `32` |
| Viết hoặc sửa component dùng chung | `04` → `02` |
| Hiểu BFF và vì sao token không xuống trình duyệt | `00` → `20` → `14` |
| Thêm một tính năng mới | `03` → `15` → `23` |
| Sửa một màn hình admin đang hỏng | `22` → `21` |
| Sửa SEO hoặc cache của storefront | `30` → `32` |

## Quy ước của tài liệu

- Mọi ví dụ code lấy từ code thật trong repo, không phải code minh hoạ
- Mọi con số (số file, số route handler, thời gian phản hồi) đều đo trên codebase này
- Mỗi file kết thúc bằng **Bạn đã học được gì** và **Đọc tiếp**
- Tài liệu dạng how-to kết thúc bằng một **danh sách kiểm**

README ở gốc repo nói về cài đặt, monorepo, database và tooling. Phần giải thích sâu nằm ở đây.
