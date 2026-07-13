import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { getApiErrors } from '@/lib/apiErrors'

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
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, answerId } = await request.json()
  if (!questionId || !answerId) {
    return NextResponse.json({ error: apiErrors.missingParams }, { status: 400 })
  }

  // 質問者本人かチェック（tagsも取得）
  const { data: question } = await supabase
    .from('questions')
    .select('id, user_id, status, tags')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: apiErrors.questionNotFound }, { status: 404 })
  if (question.user_id !== user.id) return NextResponse.json({ error: apiErrors.onlyRequesterCanAccept }, { status: 403 })
  if (question.status === 'solved') return NextResponse.json({ error: apiErrors.alreadySolved }, { status: 400 })

  // 回答の存在確認＋回答者取得
  const { data: answer } = await supabase
    .from('answers')
    .select('id, user_id, is_ai')
    .eq('id', answerId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (!answer) return NextResponse.json({ error: apiErrors.answerNotFound }, { status: 404 })

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
    await admin.rpc('increment_answer_count', { uid: answer.user_id, p_tenant_id: tenantId })

    // 高難度クエストの解決数をインクリメント
    if (question.status === 'hard') {
      await admin.rpc('increment_hard_quest_count', { uid: answer.user_id, p_tenant_id: tenantId })
    }

    // 回答実績タグに質問タグを追加（No.27）
    const questionTags: string[] = question.tags ?? []
    if (questionTags.length > 0) {
      // 既存のanswered_tagsを取得（テナント別）
      const { data: tenantProfile } = await admin
        .from('tenant_profiles')
        .select('answered_tags')
        .eq('tenant_id', tenantId)
        .eq('user_id', answer.user_id)
        .maybeSingle()

      const existing: string[] = tenantProfile?.answered_tags ?? []
      // タイトルキーワードも追加（質問タグが空の場合のフォールバック）
      const merged = Array.from(new Set([...existing, ...questionTags]))
      await admin
        .from('tenant_profiles')
        .upsert({ tenant_id: tenantId, user_id: answer.user_id, answered_tags: merged }, { onConflict: 'tenant_id,user_id' })
    }

    // 称号チェック（回答者）
    await admin.rpc('check_and_award_titles', { p_user_id: answer.user_id, p_tenant_id: tenantId })
  }

  // 質問者の解決済みカウント＋称号チェック
  await admin.rpc('increment_solved_question_count', { uid: question.user_id, p_tenant_id: tenantId })
  await admin.rpc('check_and_award_titles', { p_user_id: question.user_id, p_tenant_id: tenantId })

  return NextResponse.json({ ok: true })
}
