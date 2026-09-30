# Hướng dẫn cài đặt SEO AI Platform

## Yêu cầu
- Node.js 18+ (tải tại nodejs.org)
- Tài khoản Supabase (miễn phí tại supabase.com)
- API key Anthropic Claude (tại console.anthropic.com)
- Tùy chọn: API DataForSEO (dataforseo.com)

---

## Bước 1: Cài đặt Node.js dependencies

Mở terminal trong thư mục `d:\seovuatot` và chạy:

```bash
npm install
```

---

## Bước 2: Tạo project Supabase

1. Vào https://supabase.com/dashboard
2. Nhấn **New project**
3. Điền tên project, chọn region **Southeast Asia (Singapore)**
4. Sau khi tạo xong, vào **Settings > API** để lấy:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY)

---

## Bước 3: Tạo database tables

1. Trong Supabase, vào **SQL Editor**
2. Copy toàn bộ nội dung file `supabase-schema.sql`
3. Paste vào SQL Editor và nhấn **Run**

---

## Bước 4: Cấu hình API keys

Sửa file `.env.local` trong thư mục gốc:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Claude AI (bắt buộc để viết bài)
ANTHROPIC_API_KEY=sk-ant-api03-...

# DataForSEO (tùy chọn - có dữ liệu thật về từ khóa)
DATAFORSEO_LOGIN=email@example.com
DATAFORSEO_PASSWORD=your-password
```

---

## Bước 5: Chạy web local

```bash
npm run dev
```

Mở trình duyệt tại **http://localhost:3000**

---

## Bước 6: Deploy lên Vercel (miễn phí)

1. Tải và cài [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. Chạy trong thư mục project: `vercel`
3. Làm theo hướng dẫn (Next.js được tự động nhận diện)
4. Sau khi deploy, vào **Vercel Dashboard > Project > Settings > Environment Variables**
5. Thêm tất cả các biến từ file `.env.local`

Hoặc deploy bằng cách:
1. Push code lên GitHub
2. Vào https://vercel.com và import repository
3. Thêm environment variables
4. Deploy!

---

## Tính năng đã hoàn thành

| Tính năng | Trạng thái |
|-----------|-----------|
| Landing page | ✅ |
| Đăng ký / Đăng nhập | ✅ |
| Dashboard tổng quan | ✅ |
| AI Market Radar | ✅ (cần Anthropic API) |
| Nghiên cứu từ khóa | ✅ (cần DataForSEO) |
| Viết bài với AI | ✅ (cần Anthropic API) |
| Google Search Console | ✅ (UI sẵn sàng) |
| Cài đặt & API keys | ✅ |
| Database Supabase | ✅ |

---

## Chi phí API ước tính

| Service | Gói | Chi phí |
|---------|-----|---------|
| Supabase | Free tier | $0/tháng |
| Vercel | Hobby | $0/tháng |
| Anthropic Claude | Pay per use | ~$5-20/tháng (tùy dùng) |
| DataForSEO | Tùy gói | $50-200/tháng |

---

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Node.js version: `node --version` (cần 18+)
2. File `.env.local` đã điền đúng chưa
3. Supabase tables đã tạo chưa (chạy SQL)
4. API keys có hợp lệ không
