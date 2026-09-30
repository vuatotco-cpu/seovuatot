import { NextRequest, NextResponse } from 'next/server'
import { pingGoogleIndexing } from '@/lib/google-indexing'

export async function POST(req: NextRequest) {
  const { urls } = await req.json()
  if (!urls?.length) return NextResponse.json({ error: 'Thiếu URLs' }, { status: 400 })
  const results = await pingGoogleIndexing(urls)
  return NextResponse.json({ results, notified: results.filter(r => r.notified).length })
}
