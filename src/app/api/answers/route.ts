import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, body } = await request.json()

  if (!questionId || !body?.trim()) {
    return NextResponse.json({ error: '回答内容は必須です' }, { status: 400 })
  }
  if (body.trim().length < 30) {
    return NextResponse.json({ error: '回答は30文字以上入力してください' }, { status: 400 })
  }

  // 質問の存在確認
  const { data: question } = await supabase
    .from('questions')
    .select('id, status')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 })
  }

  const { error } = await supabase.from('answers').insert({
    question_id: questionId,
    tenant_id: tenantId,
    user_id: user.id,
    body: body.trim(),
    is_ai: false,
  })

  if (error) {
    console.error('Answer insert error:', error)
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }

  // 質問を「受付中→open維持」（解決はベストアンサー選択時）
  // 回答が付いたことだけ記録したい場合はここでステータス変更も可

  return NextResponse.json({ ok: true })
}
