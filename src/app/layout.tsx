import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SEO AI Platform - Công cụ SEO tự động 100%',
  description: 'Tìm kiếm cơ hội SEO, tạo nội dung với AI, theo dõi từ khóa và tăng traffic tự nhiên cho website của bạn.',
  keywords: 'SEO AI, công cụ SEO, tối ưu nội dung, từ khóa SEO, SEO Vietnam',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
