# Kế hoạch: tổ chức lại `docs/guides` và cập nhật README

> Trạng thái: **đã thực hiện xong**. 18 file trong `docs/guides`, README đã cập nhật.

## Vấn đề ban đầu

8 file, 3050 dòng. Bốn điểm làm khó khi đọc lại:

| Vấn đề | Bằng chứng |
| --- | --- |
| Tên file không cho biết nó nói về project nào | `nextjs-admin-spa.md`, `calling-the-api-from-next.md`, `folder-structure.md` phải mở ra mới biết |
| Một file nói về nhiều project | `folder-structure.md` = admin + client · `adding-a-resource.md` = contracts + api + admin + client + test |
| File quá dài, nhiều trách nhiệm | `api-project-setup.md` 647 dòng · `nextjs-admin-spa.md` 724 dòng |
| Không có chỉ mục | Không file nào nói "đọc cái nào trước" |

## Nguyên tắc đã áp dụng

| Nguyên tắc | Nghĩa trong tài liệu |
| --- | --- |
| **SRP** | Một file trả lời **một** câu hỏi. Tên file nói rõ câu hỏi đó |
| **Tách theo project** | `api-` · `admin-` · `client-`, cộng khối `0x` cho thứ xuyên suốt cả ba |
| **Ba lớp cho mỗi project** | `-overview` = _là gì, làm gì_ · `-structure` = _code nằm ở đâu_ · còn lại = _chạy thế nào_ |
| **Thứ tự đọc nằm trên tên file** | `0x` nền tảng · `1x` API · `2x` ADMIN · `3x` CLIENT |

Số nhảy theo bậc 10 để chèn file mới vào giữa mà không phải đánh số lại cả thư mục.

---

## Kết quả

```
docs/guides/                        4220 dòng / 18 file
├── README.md                       chỉ mục + thứ tự đọc theo mục tiêu       76
│
├── 00-architecture.md              ba service · BFF · hai mô hình render   158
├── 01-getting-started.md           chạy hệ thống trên máy local            174
├── 02-packages.md                  năm package @repo/*                     196
├── 03-add-a-feature.md             lát cắt dọc qua cả ba project           153
│
├── 10-api-overview.md              trách nhiệm · dây chuyền request · DI   178
├── 11-api-structure.md             cây thư mục apps/api                    199
├── 12-api-request-lifecycle.md     GET /categories từ đầu tới cuối         303
├── 13-api-data-access.md           Prisma · DTO · transaction · lỗi        251
├── 14-api-authentication.md        token · guard · RBAC                    312
├── 15-api-add-endpoint.md          how-to: thêm endpoint                   304
│
├── 20-admin-overview.md            SPA + BFF · Server/Client Component     201
├── 21-admin-structure.md           features/ · ranh giới server–client     247
├── 22-admin-data-flow.md           một thao tác từ đầu tới cuối            486
├── 23-admin-add-a-screen.md        how-to: thêm màn hình                   297
│
├── 30-client-overview.md           server-first · SEO · ISR · prerender    188
├── 31-client-structure.md          components/ + lib/ · ba bẫy App Router  226
└── 32-client-data-fetching.md      apiFetch · cache · 404 · server action  271
```

## Bản đồ: nội dung cũ đi về đâu

| File cũ | Dòng | Đi về đâu |
| --- | --- | --- |
| `architecture.md` | 156 | `00-architecture.md` · phần package → `02-packages.md` |
| `running-locally.md` | 150 | `01-getting-started.md` (`git mv`) |
| `api-project-setup.md` | 647 | `10-api-overview.md` · `13-api-data-access.md` · `12-api-request-lifecycle.md` |
| `api-authentication.md` | 376 | `14-api-authentication.md` (`git mv`); phần BFF → `22` và `32` |
| `adding-a-resource.md` | 418 | `15-api-add-endpoint.md` · `23-admin-add-a-screen.md` · `03-add-a-feature.md` |
| `folder-structure.md` | 381 | `21-admin-structure.md` · `31-client-structure.md` · bảng so sánh → `00` |
| `nextjs-admin-spa.md` | 724 | `20-admin-overview.md` · `22-admin-data-flow.md` |
| `calling-the-api-from-next.md` | 198 | `32-client-data-fetching.md` (`git mv`) · phần SEO → `30-client-overview.md` |

Nội dung viết mới (trước đó không có tài liệu nào nói): cây thư mục `apps/api` · vì sao storefront
server-first · năm package dùng chung bằng tiếng Việt · chỉ mục.

## Lỗi trong tài liệu cũ đã sửa luôn

| Lỗi | Sửa thành |
| --- | --- |
| `adding-a-resource.md` dùng `this.prisma.client.coupons` | `this.prisma.coupons` — `PrismaService` kế thừa `PrismaClient` |
| `running-locally.md` trỏ tới `database/README.md` không tồn tại | Chép thẳng lệnh áp migration và seed vào bước 1 |
| `calling-the-api-from-next.md` nêu ví dụ `lib/catalog/schema.ts` đã bị xoá | Thay bằng `labels.ts` thật |
| README: ví dụ `@repo/auth` dùng server action | ADMIN không còn server action — thay bằng route handler |

## README.md — 13 mục đã sửa

TOC sinh lại (anchor cũ không khớp H1, và "three layers" mâu thuẫn với "two layers" trong thân
bài) · thêm `@repo/ui` vào bảng Overview và một mục riêng · hai mục mới **Rendering models** và
**Documentation** · `@repo/api-client` nói rõ chỉ dùng phía server · `checkSession` vào bảng export
của `@repo/auth` · repository layout bổ sung `tests/`, `docs/guides|prd|plans` · mô tả `seed/dev/`
(8 file) · vòng lặp `typecheck && lint && test` ở Quick start · `pnpm --filter admin test`.

Không đụng: Database setup (đã verify 9 migration, 9 bảng, 8 permission), Monorepo & tooling,
Turborepo, Data model.

## Kiểm tra đã chạy

| Kiểm | Kết quả |
| --- | --- |
| `prettier --check` toàn bộ `docs/**` và README | sạch |
| Link tương đối trong mọi file `.md` | 0 link gãy |
| Anchor trong TOC của README | 31/31 trỏ đúng heading |
| Thuật ngữ lỗi thời trong tài liệu admin (`queries.ts`, `lib/products`) | không còn |
| Nhắc tới phase / khoá học | không có |
| Số liệu đo lại trên code | khớp: admin 95 tsx · 45 `"use client"` · 13 page · 22 route handler · client 44 tsx · 9 `"use client"` · 9 page · 1 route handler |
