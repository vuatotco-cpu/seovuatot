'use client'

import { useState } from 'react'
import {
  Search, Brain, FileText, Globe, Zap, TrendingUp, BarChart3,
  Link2, Image, Share2, ShoppingBag, Loader2, X, Copy, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Tool {
  id: string
  label: string
  desc: string
  tag: string
  tagColor: string
  credits: string
  category: string
  icon: React.ElementType
  iconBg: string
  prompt: (input: string, website?: string) => string
  inputLabel: string
  inputPlaceholder: string
}

const TOOLS: Tool[] = [
  // Từ Khóa & Thực Thể
  {
    id: 'entity-extract', label: 'Trích Xuất Thực Thể & Semantic SEO', category: 'keyword',
    desc: 'Bóc tách các Entity thực thể & Semantic Keywords để ChatGPT, Perplexity ưu tiên trích dẫn.',
    tag: 'Chuẩn GEO 2026', tagColor: 'bg-blue-100 text-blue-700',
    credits: '~1,200–1,800 Credits', icon: Brain, iconBg: 'bg-blue-600',
    inputLabel: 'Website hoặc nội dung cần phân tích', inputPlaceholder: 'vuatot.vn hoặc dán đoạn nội dung...',
    prompt: (input) => `Phân tích và trích xuất tất cả Entity thực thể, Semantic Keywords, và LSI keywords quan trọng cho SEO năm 2026 từ nội dung/website sau: "${input}". Trả về dạng danh sách có phân loại: Entity Chính, Entity Phụ, Semantic Keywords, LSI Keywords. Mỗi loại 5-10 từ, có giải thích ngắn tại sao quan trọng với Google và AI như ChatGPT/Perplexity.`,
  },
  {
    id: 'google-suggest', label: 'Google Suggest & Gom Nhóm Search Intent', category: 'keyword',
    desc: 'Đề xuất và gom nhóm từ khóa tìm kiếm theo 4 ý định: Mua hàng, So sánh, Thông tin, Điều hướng.',
    tag: 'Search Intent AI', tagColor: 'bg-purple-100 text-purple-700',
    credits: '~1,000–1,600 Credits', icon: Search, iconBg: 'bg-purple-600',
    inputLabel: 'Từ khóa seed', inputPlaceholder: 'mua điện thoại cũ...',
    prompt: (input) => `Từ từ khóa seed "${input}", hãy tạo danh sách 30 từ khóa Google Suggest và gom nhóm theo 4 nhóm Search Intent: 1) Mua hàng/Transactional (10 từ), 2) So sánh/Commercial (8 từ), 3) Thông tin/Informational (8 từ), 4) Điều hướng/Navigational (4 từ). Với mỗi từ khóa hãy ước tính volume (Cao/Trung/Thấp) và KD (Dễ/TB/Khó).`,
  },
  {
    id: 'kd-analysis', label: 'Phân Tích Cơ Hội & Độ Khó Từ Khóa', category: 'keyword',
    desc: 'Đánh giá mức độ cạnh tranh, độ khó từ khóa và xác định góc tiếp cận nhanh lên Top 1 nhất.',
    tag: 'Low KD Radar', tagColor: 'bg-green-100 text-green-700',
    credits: '~1,000–1,500 Credits', icon: BarChart3, iconBg: 'bg-green-600',
    inputLabel: 'Danh sách từ khóa (mỗi dòng một từ)', inputPlaceholder: 'mua laptop cũ\nbán điện thoại cũ\n...',
    prompt: (input) => `Phân tích cơ hội SEO cho danh sách từ khóa sau:\n${input}\n\nVới mỗi từ khóa, hãy đánh giá: 1) Độ khó ước tính (KD 0-100), 2) Cơ hội lên Top 1-3 (Cao/TB/Thấp), 3) Intent chính, 4) Chiến lược content phù hợp nhất, 5) Ưu tiên viết bài (1-5 sao). Trình bày dạng bảng rõ ràng.`,
  },
  {
    id: 'volume-research', label: 'Tra Cứu Search Volume & CPC Thực Tế', category: 'keyword',
    desc: 'Tra cứu lượng tìm kiếm hàng tháng (Search Volume), giá thầu CPC và độ canh tranh trực tiếp từ Google.',
    tag: 'Keyword Tools', tagColor: 'bg-orange-100 text-orange-700',
    credits: '~1,000–1,600 Credits', icon: TrendingUp, iconBg: 'bg-orange-600',
    inputLabel: 'Nhập từ khóa cần tra cứu', inputPlaceholder: 'mua xe máy cũ trả góp...',
    prompt: (input, website) => `Ước tính search volume, CPC và các chỉ số SEO cho từ khóa "${input}" trong thị trường Việt Nam (tháng 9/2026). Cung cấp: 1) Volume ước tính/tháng, 2) CPC ước tính (USD), 3) Xu hướng (tăng/giảm/ổn định), 4) Mùa cao điểm, 5) Biến thể từ khóa tương tự có volume, 6) Đề xuất bài viết phù hợp nếu website là: ${website || 'vuatot.vn (sàn C2C đồ cũ)'}.`,
  },

  // Nội Dung & Dàn Ý
  {
    id: 'topic-cluster', label: 'Tạo Topic Cluster & Topical Map 2026', category: 'content',
    desc: 'Xây dựng cấu trúc 1 Bài Trụ Cột (Pillar) + 5 Bài Vệ Tinh (Cluster) bao vây toàn diện chủ đề.',
    tag: 'Pillar & Cluster', tagColor: 'bg-blue-100 text-blue-700',
    credits: '~1,800–2,800 Credits', icon: Brain, iconBg: 'bg-blue-700',
    inputLabel: 'Chủ đề hoặc niche cần xây cluster', inputPlaceholder: 'điện thoại cũ, sàn C2C Việt Nam...',
    prompt: (input, website) => `Tạo Topic Cluster hoàn chỉnh cho chủ đề "${input}" dành cho website ${website || 'vuatot.vn'}. Bao gồm:\n1) 1 Pillar Article (Bài Trụ Cột): tiêu đề, từ khóa chính, outline 10 H2\n2) 5 Cluster Articles: mỗi bài có tiêu đề, từ khóa, intent, KD ước tính, tóm tắt 50 từ\n3) Internal linking strategy: bài nào link tới bài nào\n4) Publishing schedule: thứ tự viết theo độ ưu tiên.`,
  },
  {
    id: 'outline-h2h3', label: 'Tạo Dàn Ý Chuyên Sâu Chuẩn H2-H3', category: 'content',
    desc: 'Sinh dàn bài H2, H3 chi tiết, logic, tích hợp sẵn các điểm nhấn Key Takeaways và FAQ.',
    tag: 'Chuẩn E-E-A-T', tagColor: 'bg-teal-100 text-teal-700',
    credits: '~1,200–2,000 Credits', icon: FileText, iconBg: 'bg-teal-600',
    inputLabel: 'Tiêu đề bài viết + từ khóa', inputPlaceholder: 'Cách chọn điện thoại cũ uy tín năm 2026 | từ khóa: điện thoại cũ',
    prompt: (input) => `Tạo dàn ý bài viết SEO chuẩn E-E-A-T cho: "${input}"\n\nYêu cầu:\n- 1 Introduction (200 từ, hook mạnh)\n- 6-8 H2 chính với 2-3 H3 mỗi H2\n- Mỗi H2 có: điểm chính cần cover, LSI keywords lồng ghép, loại nội dung (text/list/table/image)\n- 1 phần Key Takeaways (3-5 bullet điểm)\n- 5-7 câu FAQ chuẩn Schema\n- 1 Conclusion với CTA\nTổng outline ~1,500-2,000 từ.`,
  },
  {
    id: 'ctr-title', label: 'Tạo Tiêu Đề SEO Giật Tít CTR Cao', category: 'content',
    desc: 'Tạo 10 tiêu đề bài viết hấp dẫn, tối ưu tự nhiên tìm kiếm và kích thích người dùng click ngay.',
    tag: 'High CTR Boost', tagColor: 'bg-red-100 text-red-700',
    credits: '~500–800 Credits', icon: Zap, iconBg: 'bg-red-600',
    inputLabel: 'Từ khóa hoặc chủ đề bài viết', inputPlaceholder: 'mua xe máy cũ trả góp lãi suất thấp...',
    prompt: (input) => `Tạo 10 tiêu đề bài viết SEO cho từ khóa "${input}". Mỗi tiêu đề phải:\n- Chứa từ khóa chính tự nhiên\n- Có con số cụ thể (năm, %, số lượng)\n- Dùng power words gây tò mò/urgent\n- Dài 55-65 ký tự (chuẩn Title Tag SEO)\n- Phù hợp với người đọc Việt Nam 2026\nXếp theo dự đoán CTR từ cao đến thấp, có giải thích ngắn tại sao.`,
  },
  {
    id: 'faq-schema', label: 'Tạo FAQ & Schema JSON-LD Chuẩn SEO', category: 'content',
    desc: 'Tạo bộ câu hỏi thường gặp và đoạn mã JSON-LD FAQ Schema chuẩn Google Rich Snippets.',
    tag: 'Rich Snippets', tagColor: 'bg-yellow-100 text-yellow-700',
    credits: '~800–1,400 Credits', icon: FileText, iconBg: 'bg-yellow-600',
    inputLabel: 'Chủ đề/từ khóa cần tạo FAQ', inputPlaceholder: 'cách bán đồ cũ trên Vua Tốt...',
    prompt: (input) => `Tạo 10 câu FAQ chuẩn SEO cho chủ đề "${input}" kèm Schema JSON-LD hoàn chỉnh.\n\nYêu cầu:\n- 10 câu hỏi thực tế người dùng hay tìm kiếm trên Google\n- Câu trả lời 50-80 từ mỗi câu, tự nhiên, đủ thông tin\n- Output 1: Danh sách Q&A (format Markdown)\n- Output 2: Code JSON-LD Schema FAQPage hoàn chỉnh, ready to paste vào <head>`,
  },
  {
    id: 'humanize', label: 'AI Humanizer & Tẩy Mùi Văn Bản AI', category: 'content',
    desc: 'Điều chỉnh lại văn bản chuẩn 4 chế độ: General, SEO, Article và Humanize với từ đồng nghĩa trực tiếp.',
    tag: 'Human Voice', tagColor: 'bg-pink-100 text-pink-700',
    credits: '~1,000–1,800 Credits', icon: Brain, iconBg: 'bg-pink-600',
    inputLabel: 'Dán nội dung cần humanize', inputPlaceholder: 'Dán đoạn văn AI tạo ra cần tẩy mùi...',
    prompt: (input) => `Viết lại đoạn văn bản sau theo giọng người Việt Nam thật, tự nhiên, xóa hoàn toàn "mùi AI":\n\n"${input}"\n\nYêu cầu:\n- Thay thế cấu trúc câu máy móc bằng giọng văn tự nhiên\n- Thêm ví dụ thực tế, idioms tiếng Việt phù hợp\n- Giữ nguyên thông tin chính xác\n- Thêm variation câu ngắn-dài xen kẽ\n- Đảm bảo pass AI detector (GPTZero, Copyleaks)\nXuất bản kết quả viết lại hoàn chỉnh.`,
  },

  // Audit & Kỹ Thuật
  {
    id: 'onpage-audit', label: 'Audit Toàn Diện On-Page & Kỹ Thuật SEO', category: 'audit',
    desc: 'Quét toàn diện mã nguồn HTML: Tiêu đề, Meta description, H1-H6, Schema JSON-LD, ảnh Alt và link nội bộ.',
    tag: 'On-Page Live Engine', tagColor: 'bg-gray-100 text-gray-700',
    credits: '~1,200–1,800 Credits', icon: Globe, iconBg: 'bg-gray-700',
    inputLabel: 'URL trang cần audit', inputPlaceholder: 'https://vuatot.vn/blog/bai-viet...',
    prompt: (input) => `Thực hiện audit SEO on-page hoàn chỉnh cho URL: "${input}"\n\nKiểm tra và đánh giá:\n1. Title tag (độ dài, từ khóa, CTR)\n2. Meta description (độ dài, CTA, từ khóa)\n3. Cấu trúc H1-H6 (logic, từ khóa)\n4. Nội dung (E-E-A-T score, độ sâu, readability)\n5. Internal links (số lượng, anchor text, orphan pages)\n6. Image alt text (tỷ lệ có alt, chuẩn SEO)\n7. Schema Markup (có/thiếu loại nào)\n8. Core Web Vitals issues (predicted)\nĐưa ra điểm tổng 0-100 và top 5 vấn đề cần sửa gấp.`,
  },
  {
    id: 'google-index-check', label: 'Kiểm Tra Trạng Thái Google Indexing', category: 'audit',
    desc: 'Kiểm tra xem URL đã được Google lập chỉ mục (Indexed) hay bị chặn bởi robots, lỗi canonical.',
    tag: 'Google Index', tagColor: 'bg-blue-100 text-blue-700',
    credits: '~800–1,400 Credits', icon: Search, iconBg: 'bg-blue-600',
    inputLabel: 'URL hoặc danh sách URL cần kiểm tra', inputPlaceholder: 'https://vuatot.vn/...',
    prompt: (input) => `Hướng dẫn và phân tích tình trạng Google Indexing cho URL: "${input}"\n\nCung cấp:\n1. Lý do phổ biến nhất khiến URL không được index\n2. Cách kiểm tra bằng Google Search Console (từng bước)\n3. Cách dùng site: operator để verify\n4. Danh sách checklist 10 điểm cần kiểm tra\n5. Fix script cho robots.txt và sitemap\n6. Cách dùng Google Indexing API để yêu cầu index ngay`,
  },
  {
    id: 'schema-check', label: 'Kiểm Tra & Chuẩn Hóa Schema JSON-LD', category: 'audit',
    desc: 'Bóc tách mã dữ liệu có cấu trúc JSON-LD, kiểm tra lỗi cú pháp và thiếu trường dữ liệu chuẩn Google.',
    tag: 'Rich Snippets Test', tagColor: 'bg-yellow-100 text-yellow-700',
    credits: '~600–1,200 Credits', icon: FileText, iconBg: 'bg-yellow-600',
    inputLabel: 'Dán Schema JSON-LD cần kiểm tra', inputPlaceholder: '{ "@context": "https://schema.org", ... }',
    prompt: (input) => `Kiểm tra và chuẩn hóa Schema JSON-LD sau:\n\n${input}\n\nPhân tích:\n1. Loại Schema (Article, FAQ, Product, BreadcrumbList...)\n2. Các trường bắt buộc còn thiếu\n3. Lỗi cú pháp JSON\n4. Trường nên thêm để đạt Rich Snippet\n5. Output Schema đã chuẩn hóa hoàn chỉnh\n6. Hướng dẫn test bằng Google Rich Results Test`,
  },
  {
    id: 'sitemap-health', label: 'Kiểm Tra Sức Khỏe & Cấu Trúc Sitemap XML', category: 'audit',
    desc: 'Đọc và phân tích sitemap.xml: Đếm tổng bài viết, phân trang sitemap index và phát hiện bài bị trẻ cập nhật.',
    tag: 'XML Sitemap Index', tagColor: 'bg-teal-100 text-teal-700',
    credits: '~800–1,400 Credits', icon: Globe, iconBg: 'bg-teal-600',
    inputLabel: 'URL Sitemap XML', inputPlaceholder: 'https://vuatot.vn/sitemap.xml',
    prompt: (input) => `Phân tích sitemap XML tại: "${input}"\n\nHướng dẫn kiểm tra và đánh giá:\n1. Cách đọc sitemap index vs sitemap thông thường\n2. Best practices cho sitemap laravel/PHP\n3. Checklist 10 điểm sitemap chuẩn Google\n4. Các lỗi phổ biến và cách fix\n5. Template sitemap XML chuẩn cho Laravel website\n6. Cách submit sitemap lên Google Search Console`,
  },
  {
    id: 'image-seo', label: 'Kiểm Tra & Tối Ưu Hình Ảnh Chuẩn SEO', category: 'audit',
    desc: 'Quét toàn bộ hình ảnh trên trang: Tìm ảnh thiếu Alt, kích thước gây vỡ layout và chưa bật Lazy loading.',
    tag: 'Image Alt & CLS', tagColor: 'bg-pink-100 text-pink-700',
    credits: '~800–1,400 Credits', icon: Image, iconBg: 'bg-pink-600',
    inputLabel: 'URL trang cần kiểm tra ảnh', inputPlaceholder: 'https://vuatot.vn/bai-viet-nao-do...',
    prompt: (input) => `Hướng dẫn tối ưu ảnh SEO hoàn chỉnh cho trang: "${input}"\n\n1. Checklist ảnh chuẩn SEO 2026 (Alt text, Title, Caption, File name)\n2. Format ảnh tốt nhất: WebP vs AVIF vs JPEG 2000\n3. Công thức viết Alt text chứa từ khóa tự nhiên\n4. Lazy loading implementation cho Laravel/PHP\n5. Image CDN setup (Cloudinary, BunnyCDN...)\n6. Script tự động tạo Alt text bằng AI cho ảnh cũ`,
  },

  // E-Com
  {
    id: 'product-desc', label: 'Viết Mô Tả Sản Phẩm Chuẩn SEO E-Com', category: 'ecom',
    desc: 'Tạo mô tả sản phẩm chuẩn AIDA: Thu hút, Tạo hứng thú, Tạo khát khao & Thúc đẩy mua hàng.',
    tag: 'Shopify & Woo', tagColor: 'bg-green-100 text-green-700',
    credits: '~1,000–1,800 Credits', icon: ShoppingBag, iconBg: 'bg-green-600',
    inputLabel: 'Tên sản phẩm & thông số kỹ thuật', inputPlaceholder: 'iPhone 13 Pro Max 256GB Cũ - Like New...',
    prompt: (input) => `Viết mô tả sản phẩm chuẩn SEO theo công thức AIDA cho: "${input}"\n\n1. Headline hấp dẫn (có từ khóa, benefit chính)\n2. Đoạn mô tả ngắn 50-100 từ (hook, USP)\n3. Mô tả chi tiết 200-300 từ (features → benefits)\n4. Bullet list 5-7 điểm nổi bật\n5. Social proof / trust signals\n6. CTA mạnh (urgency + scarcity)\n7. Meta description 155 ký tự\n8. Schema JSON-LD Product hoàn chỉnh`,
  },
  {
    id: 'product-title', label: 'Tạo Tiêu Đề Sản Phẩm Đột Phá Doanh Số', category: 'ecom',
    desc: 'Tạo 8 biến thể tiêu đề sản phẩm chuẩn định dạng thương mại điện tử, gia tăng tỉ lệ click.',
    tag: 'E-Com Booster', tagColor: 'bg-purple-100 text-purple-700',
    credits: '~400–700 Credits', icon: Zap, iconBg: 'bg-purple-600',
    inputLabel: 'Sản phẩm + thông số chính', inputPlaceholder: 'Laptop Dell XPS 15 cũ, i7-11800H, 16GB RAM...',
    prompt: (input) => `Tạo 8 biến thể tiêu đề sản phẩm tối ưu cho marketplace (Shopee, Lazada, Tiki) cho: "${input}"\n\nMỗi tiêu đề:\n- Chứa model/thương hiệu rõ ràng\n- Có tình trạng sản phẩm\n- Điểm nổi bật nhất\n- Từ khóa bổ sung tự nhiên\n- 70-100 ký tự\n\nXếp theo dự đoán CTR, có giải thích công thức.`,
  },

  // Viral Social
  {
    id: 'facebook-post', label: 'Tạo Bài Viết Facebook Viral & Tương Tác', category: 'social',
    desc: 'Viết bài Facebook Fanpage/Group có cấu trúc Hook giật gân, thân bài hấp dẫn và CTA mạnh mẽ.',
    tag: 'Meta Social', tagColor: 'bg-blue-100 text-blue-700',
    credits: '~600–1,200 Credits', icon: Share2, iconBg: 'bg-blue-600',
    inputLabel: 'Chủ đề hoặc sản phẩm cần viết', inputPlaceholder: 'bán điện thoại iPhone cũ, mẹo mua đồ cũ...',
    prompt: (input) => `Tạo 3 bài viết Facebook Viral cho chủ đề "${input}" dành cho Fanpage/Group mua bán đồ cũ.\n\nMỗi bài cần:\n1. Hook mạnh (5-10 từ, gây tò mò/shock/emotion)\n2. Story ngắn 3-5 câu dẫn vào chủ đề\n3. Nội dung chính (list hoặc narrative, 150-250 từ)\n4. CTA rõ ràng (tag bạn bè/comment/share)\n5. 5-8 hashtag phù hợp\n6. Emoji strategy (không spam)\n\nXếp theo dự đoán engagement rate.`,
  },
  {
    id: 'tiktok-script', label: 'Kịch Bản Video Ngắn TikTok / Reels / Shorts', category: 'social',
    desc: 'Tạo kịch bản video 45-60 giây chuẩn cấu trúc 3s Hook, khơi gợi vấn đề và kêu gọi chuyển đổi cao.',
    tag: 'TikTok & Reels 60s', tagColor: 'bg-pink-100 text-pink-700',
    credits: '~800–1,400 Credits', icon: Zap, iconBg: 'bg-pink-600',
    inputLabel: 'Chủ đề video', inputPlaceholder: 'mẹo chọn điện thoại cũ, cảnh báo mua laptop cũ...',
    prompt: (input) => `Tạo kịch bản video TikTok/Reels 45-60 giây cho chủ đề "${input}".\n\nCấu trúc:\n[0-3s] HOOK: Câu mở đầu gây shock/tò mò cực mạnh\n[3-15s] PROBLEM: Vấn đề người xem đang gặp phải\n[15-40s] SOLUTION: 3-5 bước giải quyết nhanh gọn\n[40-50s] RESULT: Kết quả/benefit cụ thể\n[50-60s] CTA: Kêu gọi follow/comment/share\n\nThêm:\n- B-roll suggestions (cảnh quay phụ)\n- Text overlay suggestions\n- Caption & hashtag cho TikTok`,
  },
]

const CATEGORIES = [
  { key: 'all', label: 'Tất Cả Công Cụ', icon: Zap },
  { key: 'keyword', label: 'Từ Khóa & Thực Thể', icon: Search },
  { key: 'content', label: 'Nội Dung & Dàn Ý', icon: FileText },
  { key: 'audit', label: 'Audit & Kỹ Thuật Site', icon: Globe },
  { key: 'ecom', label: 'Sản Phẩm E-Com', icon: ShoppingBag },
  { key: 'social', label: 'Viral Social', icon: Share2 },
]

export default function ToolsPage() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const filtered = TOOLS.filter(t =>
    (category === 'all' || t.category === category) &&
    (search === '' || t.label.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
  )

  const runTool = async () => {
    if (!input.trim()) { toast.error('Nhập nội dung cần xử lý'); return }
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: input,
          title: activeTool!.label,
          intent: 'Informational',
          wordCount: 1000,
          systemPrompt: 'Bạn là chuyên gia SEO Việt Nam, trả lời chi tiết, có cấu trúc rõ ràng bằng tiếng Việt.',
          customPrompt: activeTool!.prompt(input, 'vuatot.vn'),
        }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setResult(prev => prev + decoder.decode(value))
        }
      }
    } catch {
      toast.error('Lỗi khi chạy công cụ. Kiểm tra API key.')
    }
    setLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Kho Công Cụ Nghiên Cứu & Tối Ưu SEO 2026</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Bộ Công Cụ SEO AI Chuyên Sâu</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tất cả công cụ đều chạy trực tiếp trên AI. Mỗi kết quả đều có thể chuyển thẳng sang tạo bài viết hoặc kế hoạch tự động.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Tổng công cụ</p>
          <p className="text-2xl font-bold text-brand-600">{TOOLS.length}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 bg-white border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              category === c.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}>
            <c.icon className="w-4 h-4" /> {c.label}
          </button>
        ))}
        <div className="ml-auto pl-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm công cụ..."
              className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-48" />
          </div>
        </div>
      </div>

      {/* Tool Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4 max-w-6xl">
          {filtered.map(tool => (
            <div key={tool.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => { setActiveTool(tool); setInput(''); setResult('') }}>
              <div className="flex items-start justify-between mb-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tool.tagColor)}>{tool.tag}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', tool.iconBg)}>
                  <tool.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors leading-snug">{tool.label}</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{tool.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{tool.credits}</span>
                <button className="text-xs text-brand-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Mở Công Cụ <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy công cụ phù hợp</p>
          </div>
        )}
      </div>

      {/* Tool Modal */}
      {activeTool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', activeTool.iconBg)}>
                  <activeTool.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', activeTool.tagColor)}>{activeTool.tag}</span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{activeTool.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{activeTool.credits}</p>
                </div>
              </div>
              <button onClick={() => { setActiveTool(null); setResult('') }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{activeTool.inputLabel}</label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={activeTool.inputPlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <button onClick={runTool} disabled={loading || !input.trim()}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? 'AI đang xử lý...' : 'Chạy Công Cụ'}
              </button>

              {result && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Kết quả</p>
                    <button onClick={() => { navigator.clipboard.writeText(result); toast.success('Đã copy!') }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg bg-white">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed max-h-80 overflow-y-auto">{result}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
