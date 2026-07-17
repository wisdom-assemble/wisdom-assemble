import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { findMatch, calcDeadline } from '@/lib/matching'
import { notifyMatchedUser } from '@/lib/email'
import { getApiErrors } from '@/lib/apiErrors'

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
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'
  const { id: questionId } = await params

  const { data: question } = await supabase
    .from('questions')
    .select('id, status, user_id, matched_b_id, matched_c_id, matched_b_deadline, matched_c_deadline, title, title_i18n, slug')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: apiErrors.questionNotFound }, { status: 404 })

  // 呼び出し可能: 質問者本人 OR マッチングされた回答者
  const isOwner = question.user_id === user.id
  const isMatchedAnswerer =
    question.matched_b_id === user.id || question.matched_c_id === user.id
  if (!isOwner && !isMatchedAnswerer) {
    return NextResponse.json({ error: apiErrors.notPermitted }, { status: 403 })
  }

  // 質問者が直接 hard に移行したい場合。
  // UIで「高難度へ」ボタンが出る条件と厳密に一致させ、不正な直叩き（解決済みを
  // hardに戻す・段階を飛ばす等）をサーバー側でも弾く。
  const body = await request.json().catch(() => ({}))
  if (isOwner && body.forceHard) {
    // UIのボタン表示条件を再現するため、回答状況と期限を取得して判定する。
    const { data: answerRows } = await admin
      .from('answers')
      .select('user_id')
      .eq('question_id', questionId)
    const answers = answerRows ?? []
    const hasAnswers = answers.length > 0
    const bExpired = !!question.matched_b_deadline && new Date(question.matched_b_deadline) < new Date()
    const hasCAnswer = !!question.matched_c_id && answers.some((a) => a.user_id === question.matched_c_id)

    // ⑤ B段階（専門家1が回答済み or 期限切れ）から高難度へ
    const canHardFromB = question.status === 'open' && !!question.matched_b_id && (hasAnswers || bExpired)
    // ④ C段階（専門家2が実際に回答済み）から高難度へ
    const canHardFromC = question.status === 'matched_c' && hasCAnswer

    if (!canHardFromB && !canHardFromC) {
      return NextResponse.json({ error: apiErrors.cannotEscalate }, { status: 400 })
    }

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
          questionTitleTranslations: question.title_i18n ?? undefined,
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
    return NextResponse.json({ error: apiErrors.cannotEscalate }, { status: 400 })
  }
}
