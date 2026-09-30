import { NextResponse } from 'next/server'
import { getAIStatus } from '@/lib/ai-router'

export async function GET() {
  const status = getAIStatus()
  const activeCount = Object.values(status).filter(s => s.active).length
  return NextResponse.json({ status, activeCount })
}
