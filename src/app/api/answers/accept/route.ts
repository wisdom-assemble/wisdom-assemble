import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 質問者がベストアンサーを選択する
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = getAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, answerId } = await request.json()
  if (!questionId || !answerId) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  // 質問者本人かチェック（tagsも取得）
  const { data: question } = await supabase
    .from('questions')
    .select('id, user_id, status, tags')
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
  await admin.from('answers').update({ is_accepted: true }).eq('id', answerId)

  // 質問をsolvedに
  await admin
    .from('questions')
    .update({ status: 'solved', solved_at: new Date().toISOString(), solved_by: answer.user_id })
    .eq('id', questionId)

  // 人間の回答者なら実績加算 + タグ蓄積 + 称号チェック
  if (!answer.is_ai && answer.user_id) {
    // answer_countをインクリメント
    await admin.rpc('increment_answer_count', { uid: answer.user_id })

    // 回答実績タグに質問タグを追加（No.27）
    const questionTags: string[] = question.tags ?? []
    if (questionTags.length > 0) {
      // 既存のanswered_tagsを取得
      const { data: profile } = await admin
        .from('profiles')
        .select('answered_tags')
        .eq('id', answer.user_id)
        .single()

      if (profile) {
        const existing: string[] = profile.answered_tags ?? []
        // タイトルキーワードも追加（質問タグが空の場合のフォールバック）
        const merged = Array.from(new Set([...existing, ...questionTags]))
        await admin
          .from('profiles')
          .update({ answered_tags: merged })
          .eq('id', answer.user_id)
      }
    }

    // 称号チェック（DB関数で自動付与）
    await admin.rpc('check_and_award_titles', { p_user_id: answer.user_id })
  }

  return NextResponse.json({ ok: true })
}
