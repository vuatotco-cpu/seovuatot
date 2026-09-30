import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getKdColor(kd: number): string {
  if (kd <= 20) return 'text-green-600 bg-green-50'
  if (kd <= 40) return 'text-yellow-600 bg-yellow-50'
  if (kd <= 60) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

export function getKdLabel(kd: number): string {
  if (kd <= 20) return 'Rất dễ'
  if (kd <= 40) return 'Dễ'
  if (kd <= 60) return 'Trung bình'
  if (kd <= 80) return 'Khó'
  return 'Rất khó'
}

export function getIntentColor(intent: string): string {
  const colors: Record<string, string> = {
    Informational: 'bg-blue-100 text-blue-700',
    Commercial: 'bg-purple-100 text-purple-700',
    Transactional: 'bg-green-100 text-green-700',
    Navigational: 'bg-gray-100 text-gray-700',
  }
  return colors[intent] || 'bg-gray-100 text-gray-700'
}
