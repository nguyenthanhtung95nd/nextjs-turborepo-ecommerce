# Chạy hệ thống trên máy local

Hướng dẫn này đưa bạn từ máy trắng tới ba service chạy được và storefront hiển thị sản phẩm.

## Yêu cầu

| Công cụ | Phiên bản | Kiểm tra               |
| ------- | --------- | ---------------------- |
| Node.js | ≥ 22      | `node --version`       |
| pnpm    | ≥ 10      | `pnpm --version`       |
| Docker  | bất kỳ    | `docker --version`     |

## 1. Khởi động PostgreSQL

Database chạy trong một container Docker tạo bằng tay. Nếu container đã tồn tại:

```bash
docker start ecommerce-postgres
```

Nếu chưa có, tạo mới:

```bash
docker run -d \
  --name ecommerce-postgres \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=app \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 \
  -v ecommerce_pgdata:/var/lib/postgresql/data \
  postgres:16
```

Volume `ecommerce_pgdata` giữ dữ liệu lại giữa các lần khởi động lại container.

Lần đầu tiên phải tạo bảng và nạp dữ liệu. Thứ tự bắt buộc — khoá ngoại phụ thuộc vào nó:

```bash
# 1. chép thư mục SQL vào container (chạy psql bên trong tránh lỗi encoding trên Windows)
docker cp database ecommerce-postgres:/tmp/database

# 2. migration theo số thứ tự 001 → 009, rồi seed: reference trước, dev sau
docker exec ecommerce-postgres sh -c \
  'for f in /tmp/database/migrations/*.sql /tmp/database/seed/reference/*.sql /tmp/database/seed/dev/*.sql; do
     echo "applying $f"; psql -U app -d ecommerce -v ON_ERROR_STOP=1 -f "$f";
   done'
```

Mọi file seed đều idempotent, chạy lại nhiều lần không sao. `seed/reference/` là danh mục quyền —
nạp ở **mọi** môi trường; `seed/dev/` chỉ dành cho máy local. Xem phần **Database setup** trong
`README.md` ở gốc repo để biết chi tiết và cách reset.

Tài khoản admin có sẵn trên máy local: `admin@local.dev` / `Admin123!`

## 2. Cài dependency

```bash
pnpm install
```

## 3. Cấu hình biến môi trường

Mỗi project có file `.env` riêng, tất cả đều gitignored.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/client/.env.example apps/client/.env.local
```

Điền các giá trị sau:

| File                     | Biến                 | Giá trị                                                       |
| ------------------------ | -------------------- | ------------------------------------------------------------- |
| `apps/api/.env`          | `DATABASE_URL`       | `postgres://app:app@localhost:5432/ecommerce?sslmode=disable` |
|                          |                      | Prisma CLI cũng đọc file này                                  |
| `apps/api/.env`          | `JWT_SECRET`         | Chuỗi ngẫu nhiên, ví dụ `openssl rand -base64 32`             |
| ADMIN và CLIENT          | `API_URL`            | `http://localhost:3002`                                        |
| ADMIN và CLIENT          | `AUTH_SECRET`        | Sinh bằng `npx auth secret`                                    |
| ADMIN và CLIENT          | `AUTH_COOKIE_PREFIX` | `admin-authjs` và `shop-authjs`                                |

Chỉ API có `DATABASE_URL`. ADMIN và CLIENT không mở kết nối database, nên chúng không cần —
và không nên có — biến đó.

> **`AUTH_COOKIE_PREFIX` không được bỏ trống.** Cookie không phân biệt cổng, nên nếu hai app dùng
> chung tên cookie trên `localhost` thì app này sẽ đăng xuất app kia, và log đầy
> `JWTSessionError: no matching decryption secret`.

## 4. Sinh Prisma client

```bash
pnpm --filter api run db:generate
```

Lệnh này đọc `apps/api/prisma/schema.prisma` và sinh client vào `node_modules/@prisma/client`.
Chạy lại mỗi khi schema đổi.

Nếu schema SQL vừa thay đổi, dùng `db:pull` để Prisma đọc lại cấu trúc thật từ database rồi sinh
client luôn:

```bash
pnpm --filter api run db:pull
```

## 5. Chạy cả ba service

```bash
pnpm dev
```

Turborepo build các package dùng chung trước rồi khởi động cả ba:

```
API     http://localhost:3002     Swagger tại /api/docs
ADMIN   http://localhost:3001
CLIENT  http://localhost:3000
```

Chạy riêng một project:

```bash
pnpm --filter api dev
pnpm --filter admin dev
pnpm --filter client dev
```

Chạy riêng ADMIN hoặc CLIENT thì vẫn phải bật API, vì mọi dữ liệu đều đi qua nó.

## 6. Kiểm tra

```bash
curl http://localhost:3002/products
```

Phải trả về JSON có `items`, `total`, `page`, `pageCount`.

Mở <http://localhost:3000> — storefront hiển thị sản phẩm. Mở
<http://localhost:3002/api/docs> — Swagger liệt kê mọi endpoint và gọi thử được ngay trên trang.

## Lệnh thường dùng

| Lệnh                | Tác dụng                                       |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Chạy cả ba service                             |
| `pnpm build`        | Build toàn bộ workspace                        |
| `pnpm test`         | Chạy test toàn bộ workspace                    |
| `pnpm typecheck`    | Kiểm kiểu toàn bộ workspace                    |
| `pnpm lint`         | ESLint toàn bộ workspace                       |
| `pnpm format`       | Prettier ghi đè toàn bộ file                   |

## Xử lý sự cố

**`API_URL is not set`** — CLIENT hoặc ADMIN thiếu `API_URL` trong `.env.local`. Thêm vào rồi
khởi động lại dev server; Next chỉ đọc file env lúc khởi động.

**Storefront báo "Something went wrong"** — API không chạy. Kiểm tra bằng
`curl http://localhost:3002/products`.

**`Cannot find module '@repo/contracts'`** — package dùng chung chưa được build. Chạy
`pnpm build` một lần, hoặc `pnpm dev` (nó tự build trước).

**`Could not find a production build`** khi chạy `pnpm start` — `next dev` và `next build` dùng
chung thư mục `.next`. Build lại trước khi start.

**Build CLIENT thất bại** — trang chủ và trang chi tiết sản phẩm được prerender lúc build, nên
chúng cần API chạy sẵn. Khởi động API trước khi `pnpm build`.

**Đăng nhập ADMIN xong lại bị đá về `/login`** — hai app dùng chung `AUTH_COOKIE_PREFIX`. Đặt hai
giá trị khác nhau rồi xoá cookie của `localhost`.

## Đọc tiếp

- [Kiến trúc](./00-architecture.md) — ba service chia việc thế nào
- [Thêm một tính năng](./03-add-a-feature.md) — bắt tay vào việc đầu tiên
