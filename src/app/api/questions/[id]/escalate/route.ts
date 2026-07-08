import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { findMatch, calcDeadline } from '@/lib/matching'
import { notifyMatchedUser } from '@/lib/email'

// 回答者がギブアップ → B→C→高難度クエストへエスカレーション
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'
  const { id: questionId } = await params

  const { data: question } = await supabase
    .from('questions')
    .select('id, status, user_id, matched_b_id, matched_c_id, title, slug')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 })

  // 呼び出し可能: 質問者本人 OR マッチングされた回答者
  const isOwner = question.user_id === user.id
  const isMatchedAnswerer =
    question.matched_b_id === user.id || question.matched_c_id === user.id
  if (!isOwner && !isMatchedAnswerer) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  // 質問者が直接 hard に移行したい場合
  const body = await request.json().catch(() => ({}))
  if (isOwner && body.forceHard) {
    await admin.from('questions').update({ status: 'hard' }).eq('id', questionId)
    return NextResponse.json({ ok: true, nextStatus: 'hard' })
  }

  if (question.status === 'open') {
    // BがギブアップまたはタイムアウトしてCへ
    const excludeIds = [question.user_id, question.matched_b_id].filter(Boolean) as string[]
    const matchedC = await findMatch(tenantId, questionId, excludeIds)
    if (matchedC) {
      await admin.from('questions').update({
        status: 'matched_c',
        matched_c_id: matchedC,
        matched_c_deadline: calcDeadline(8),
      }).eq('id', questionId)
      try {
        await notifyMatchedUser({
          userId: matchedC,
          tenantId,
          questionTitle: question.title,
          questionSlug: question.slug,
        })
      } catch (e) {
        console.error('notifyMatchedUser error:', e)
      }
      return NextResponse.json({ ok: true, nextStatus: 'matched_c', matchedC })
    } else {
      // C候補なし → 即hard昇格
      await admin.from('questions').update({ status: 'hard' }).eq('id', questionId)
      return NextResponse.json({ ok: true, nextStatus: 'hard' })
    }

  } else if (question.status === 'matched_c') {
    // Cがギブアップ → 高難度クエスト
    await admin.from('questions').update({ status: 'hard' }).eq('id', questionId)
    return NextResponse.json({ ok: true, nextStatus: 'hard' })

  } else {
    return NextResponse.json({ error: 'このステータスではエスカレーションできません' }, { status: 400 })
  }
}
