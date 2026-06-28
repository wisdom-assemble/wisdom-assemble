import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { askWithScore, checkInScope } from '@/lib/gemini'
import { findMatch, calcDeadline } from '@/lib/matching'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w぀-ゟ゠-ヿ一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

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
  if (title.trim().length < 5) {
    return NextResponse.json({ error: 'タイトルは5文字以上入力してください' }, { status: 400 })
  }
  if (body.trim().length < 30) {
    return NextResponse.json({ error: '詳細は30文字以上入力してください' }, { status: 400 })
  }

  // ① 保存前にジャンル判定（OKなら保存、NGなら即拒否）
  try {
    const inScope = await checkInScope(tenantId, `${title}\n\n${body}`)
    if (!inScope) {
      return NextResponse.json(
        { error: 'このサービスではプログラミング・デバッグの質問のみ受け付けています。' },
        { status: 422 }
      )
    }
  } catch (e) {
    console.error('Scope check error:', e)
    // 判定失敗時は通す（ユーザー体験優先）
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

  // ② ジャンル内確定なのでスコア付き回答を生成
  let resultType: 'ai' | 'matched' | 'pending' = 'pending'
  try {
    const result = await askWithScore(tenantId, `${title}\n\n${body}`)

    if (result.routed === 'ai') {
      await supabase.from('answers').insert({
        question_id: question.id,
        tenant_id: tenantId,
        body: result.answer,
        is_ai: true,
        ai_score: result.score,
      })
      await supabase
        .from('questions')
        .update({ status: 'ai_answered', ai_score: result.score })
        .eq('id', question.id)
      resultType = 'ai'
    } else {
      console.log(`[Routing] score=${result.score} → human (tenant=${tenantId})`)
      const matchedB = await findMatch(tenantId, question.id, [user.id])

      if (matchedB) {
        await supabase.from('questions').update({
          status: 'open',
          ai_score: result.score,
          matched_b_id: matchedB,
          matched_b_deadline: calcDeadline(24),
        }).eq('id', question.id)
        console.log(`[Matching] B=${matchedB}`)
        resultType = 'matched'
      } else {
        const matchedC = await findMatch(tenantId, question.id, [user.id])
        if (matchedC) {
          await supabase.from('questions').update({
            status: 'matched_c',
            ai_score: result.score,
            matched_c_id: matchedC,
            matched_c_deadline: calcDeadline(24),
          }).eq('id', question.id)
          console.log(`[Matching] B=none → C=${matchedC}`)
          resultType = 'matched'
        } else {
          await supabase.from('questions').update({
            status: 'hard',
            ai_score: result.score,
          }).eq('id', question.id)
          console.log(`[Matching] B=none, C=none → hard`)
        }
      }
    }
  } catch (e) {
    console.error('Groq error:', e)
  }

  return NextResponse.json({ slug: question.slug, result: resultType })
}
