import { redirect } from 'next/navigation'

// Tạm thời bỏ qua auth, vào thẳng dashboard để thiết kế
export default function Home() {
  redirect('/dashboard')
}
