import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// 回答者がギブアップ → B→C→高難度クエストへエスカレーション
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'
  const { id: questionId } = await params

  const { data: question } = await supabase
    .from('questions')
    .select('id, status, matched_b_id, matched_c_id')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 })

  let nextStatus: string
  let update: Record<string, unknown> = {}

  if (question.status === 'open') {
    // Bがギブアップまたはタイムアウト → Cへ
    nextStatus = 'matched_c'
    update = { status: nextStatus, matched_b_id: user.id }
  } else if (question.status === 'matched_c') {
    // Cがギブアップまたはタイムアウト → 高難度クエスト
    nextStatus = 'hard'
    update = { status: nextStatus, matched_c_id: user.id }
  } else {
    return NextResponse.json({ error: 'このステータスではエスカレーションできません' }, { status: 400 })
  }

  await supabase.from('questions').update(update).eq('id', questionId)

  return NextResponse.json({ ok: true, nextStatus })
}
