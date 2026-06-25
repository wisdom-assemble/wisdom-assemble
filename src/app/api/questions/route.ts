import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

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
    .select('slug')
    .single()

  if (error) {
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ slug: question.slug })
}
