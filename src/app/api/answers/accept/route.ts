import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// 質問者がベストアンサーを選択する
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, answerId } = await request.json()
  if (!questionId || !answerId) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  // 質問者本人かチェック
  const { data: question } = await supabase
    .from('questions')
    .select('id, user_id, status')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 })
  if (question.user_id !== user.id) return NextResponse.json({ error: '質問者のみ選択できます' }, { status: 403 })
  if (question.status === 'solved') return NextResponse.json({ error: 'すでに解決済みです' }, { status: 400 })

  // 回答の存在確認＋回答者取得
  const { data: answer } = await supabase
    .from('answers')
    .select('id, user_id, is_ai')
    .eq('id', answerId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (!answer) return NextResponse.json({ error: '回答が見つかりません' }, { status: 404 })

  // ベストアンサーにマーク
  await supabase.from('answers').update({ is_accepted: true }).eq('id', answerId)

  // 質問をsolvedに
  await supabase
    .from('questions')
    .update({ status: 'solved', solved_at: new Date().toISOString(), solved_by: answer.user_id })
    .eq('id', questionId)

  // 人間の回答者なら実績加算
  if (!answer.is_ai && answer.user_id) {
    await supabase.rpc('increment_answer_count', { uid: answer.user_id })
  }

  return NextResponse.json({ ok: true })
}
