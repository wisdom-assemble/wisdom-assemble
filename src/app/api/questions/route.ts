import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { askGemini } from '@/lib/gemini'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')      // スペース・全角スペース → ハイフン
    .replace(/[^\w぀-ゟ゠-ヿ一-鿿-]/g, '') // 記号除去（日本語は残す）
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '0.0.0.0'

  const { title, body } = await request.json()

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'タイトルと詳細は必須です' }, { status: 400 })
  }

  // スラッグ生成（重複時は末尾に数値付加）
  let slug = toSlug(title)
  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('slug', `${slug}%`)

  if (count && count > 0) slug = `${slug}-${count + 1}`

  const { data: question, error } = await supabase
    .from('questions')
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      slug,
      ip_address: ip,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('Question insert error:', error)
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }

  // Gemini Flash で自動回答
  try {
    const aiBody = await askGemini(tenantId, `${title}\n\n${body}`)
    const canAnswer = !aiBody.includes('わかりません')

    await supabase.from('answers').insert({
      question_id: question.id,
      tenant_id: tenantId,
      body: aiBody,
      is_ai: true,
    })

    await supabase
      .from('questions')
      .update({ status: canAnswer ? 'ai_answered' : 'open' })
      .eq('id', question.id)
  } catch (e) {
    // AI回答失敗しても質問投稿は成功扱い
    console.error('Gemini error:', e)
  }

  return NextResponse.json({ slug: question.slug })
}
