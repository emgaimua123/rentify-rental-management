# 🏠 Rentify — Rental Management System

> Nền tảng quản lý cho thuê phòng / căn hộ mini: theo dõi tiền điện nước tự động, tạo hóa đơn thông minh, quản lý hợp đồng và gói Pro.

Đây là **Backend API** của Rentify, xây dựng bằng **Node.js + Express + TypeScript**, sử dụng **Prisma ORM** với **PostgreSQL**, tài liệu API tự sinh bằng **Swagger**. Hệ thống được thiết kế chạy được cả ở local lẫn serverless trên **Vercel**.

🔗 **Live demo:** https://rentify-rental-management-mu.vercel.app
📚 **API Docs (Swagger):** https://rentify-rental-management-mu.vercel.app/api-docs

---

## ✨ Tính năng nổi bật

### 🔐 Xác thực & Phân quyền (Auth)
- Đăng ký / Đăng nhập bằng **JWT** (token sống 7 ngày).
- Mật khẩu được mã hóa bằng **bcrypt**.
- **Người dùng đăng ký đầu tiên tự động trở thành ADMIN**, các tài khoản sau là USER.
- Quản lý hồ sơ cá nhân (tên, email, avatar).

### 🚪 Quản lý phòng (Room Management)
- CRUD phòng đầy đủ: thêm, sửa, xóa, xem chi tiết.
- **Tạo hàng loạt phòng tự động** theo quy tắc (ví dụ: tầng 2 → phòng 201–205) chỉ với một thao tác.
- **Xóa mềm (soft delete)** — không mất dữ liệu lịch sử.
- **Khóa logic an toàn**: không cho đổi trạng thái / xóa phòng đang có hợp đồng kích hoạt.
- Phân trang, lọc theo trạng thái, sắp xếp theo giá / tên.
- **Quản lý media phòng**: upload ảnh từ máy (multer) và đính kèm link video.

### 📄 Hợp đồng & Khách thuê (Contract & Tenant)
- Quản lý hợp đồng thuê: ngày bắt đầu / kết thúc, tiền cọc, số lượng người thuê, danh sách khách.
- Lưu **lịch sử hợp đồng** theo từng phòng.
- Thông tin khách thuê: tên, SĐT, email, CCCD/CMND.

### ⚡ Theo dõi điện nước & Hóa đơn (Utility & Billing)
- Ghi chỉ số điện / nước (số cũ – số mới) theo từng tháng.
- **Tự động tính hóa đơn**: tiền phòng + điện + nước + phí phát sinh → tổng tiền.
- Đánh dấu đã thanh toán / chưa thanh toán.
- Tạo / sửa / xóa hóa đơn, **xóa hàng loạt (batch delete)**.
- Lưu hóa đơn dạng HTML để in / xuất.

### 🧾 Bảng giá mẫu (Price Presets)
- Lưu các **gói giá mẫu** dùng lại nhiều lần: giá điện, giá nước, phí quản lý, internet, gửi xe và các phí phụ tùy chỉnh.
- Áp dụng nhanh khi tạo phòng hoặc tính hóa đơn.

### 💳 Gói Pro & Thanh toán (Subscription)
- Quản lý gói đăng ký Pro (active / hết hạn, tự động gia hạn).
- **Yêu cầu nâng cấp Pro** với quy trình duyệt: PENDING → duyệt / từ chối (kèm lý do).
- Admin có thể **cấp / thu hồi** quyền Pro thủ công.
- **Tạo mã VietQR** để thanh toán chuyển khoản nhanh (qua `img.vietqr.io`).

### 💬 Chat nội bộ & Thông báo (Chat & Notifications)
- Nhắn tin giữa người dùng (user ↔ admin), đếm tin chưa đọc, danh sách hội thoại.
- Hệ thống thông báo cho người dùng (đánh dấu đã đọc).

### 📚 Tài liệu API (Swagger)
- Tài liệu API tương tác đầy đủ tại `/api-docs`.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | Node.js |
| Ngôn ngữ | TypeScript |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL (gợi ý [Neon](https://neon.tech) – free tier) |
| Auth | JWT + bcryptjs |
| Upload file | Multer |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Deploy | Vercel (serverless) |

---

## 📁 Cấu trúc dự án

```
src/
├── index.ts                # Điểm khởi động app, cấu hình Express & Swagger
├── core/
│   ├── database/           # Prisma client
│   └── middlewares/        # Middleware upload (multer)
├── middlewares/
│   └── auth.middleware.ts  # Bảo vệ route bằng JWT (protect)
├── modules/
│   ├── auth/               # Đăng ký, đăng nhập, hồ sơ
│   ├── room/               # Phòng, media, hợp đồng
│   ├── bill/               # Hóa đơn
│   ├── preset/             # Bảng giá mẫu
│   ├── subscription/       # Gói Pro, yêu cầu Pro, thông báo
│   └── chat/               # Nhắn tin nội bộ
└── utils/
    └── vietqr.util.ts      # Sinh URL mã VietQR
prisma/
└── schema.prisma           # Định nghĩa database
```

---

## 🚀 Cài đặt & Chạy local

### 1. Yêu cầu
- Node.js 18+
- Một database PostgreSQL (đăng ký miễn phí tại [neon.tech](https://neon.tech))

### 2. Clone & cài đặt
```bash
git clone https://github.com/emgaimua123/rentify-rental-management.git
cd rentify-rental-management
npm install
```

### 3. Cấu hình biến môi trường
Sao chép file mẫu rồi điền giá trị:
```bash
cp .env.example .env
```
```env
PORT=3000
JWT_SECRET=replace-with-a-strong-random-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

### 4. Khởi tạo database
```bash
npx prisma generate   # sinh Prisma Client
npx prisma db push    # đẩy schema lên database
```

### 5. Chạy server
```bash
npm run dev
```
- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api-docs`

> 💡 **Tài khoản đầu tiên** bạn đăng ký sẽ tự động nhận quyền **ADMIN**.

---

## 📡 Tổng quan API

| Module | Base path | Mô tả |
|--------|-----------|-------|
| Auth | `/api/auth` | Đăng ký, đăng nhập, hồ sơ, danh sách user |
| Rooms | `/api/rooms` | CRUD phòng, tạo hàng loạt, media, hợp đồng |
| Bills | `/api/bills` | Hóa đơn (CRUD + xóa hàng loạt) |
| Presets | `/api/presets` | Bảng giá mẫu |
| Subscription | `/api/subscriptions`, `/api/pro-requests`, `/api/notifications` | Gói Pro, yêu cầu Pro, thông báo |
| Chat | `/api/chat` | Tin nhắn, đếm chưa đọc, hội thoại |

> Hầu hết các endpoint yêu cầu header `Authorization: Bearer <token>`. Xem chi tiết tại `/api-docs`.

### Một số endpoint tiêu biểu
```http
POST   /api/auth/register          # Đăng ký
POST   /api/auth/login             # Đăng nhập
GET    /api/rooms?page=1&limit=10  # Danh sách phòng (phân trang, lọc, sắp xếp)
POST   /api/rooms/bulk-generate    # Tạo nhiều phòng tự động
POST   /api/rooms/:roomId/images   # Upload ảnh phòng
POST   /api/bills                  # Tạo hóa đơn
DELETE /api/bills/batch            # Xóa nhiều hóa đơn
POST   /api/pro-requests           # Gửi yêu cầu nâng cấp Pro
```

---

## ☁️ Triển khai trên Vercel

1. Tạo database PostgreSQL miễn phí tại [neon.tech](https://neon.tech).
2. Push code lên GitHub, **Import Project** vào Vercel.
3. Thêm biến môi trường `DATABASE_URL` và `JWT_SECRET` trong **Project → Settings → Environment Variables**.
4. Chạy `npx prisma db push` để đẩy schema lên database production.
5. Deploy — Vercel sẽ tự build và chạy app dưới dạng serverless function (`api/index.js`).

> ✅ Bản deploy thực tế của dự án: **https://rentify-rental-management-mu.vercel.app**

---

## 📜 Scripts

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy server ở chế độ dev (hot reload) |
| `npm run build` | Sinh Prisma Client + biên dịch TypeScript |
| `npm start` | Chạy bản đã build |
| `npm run prisma:push` | Đẩy schema lên database |
| `npm run prisma:generate` | Sinh Prisma Client |
