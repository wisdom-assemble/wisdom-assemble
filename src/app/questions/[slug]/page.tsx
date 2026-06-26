import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const { data: q } = await supabase
    .from('questions')
    .select('title, body')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (!q) return {}
  return {
    title: q.title,
    description: q.body.slice(0, 160),
  }
}

export default async function QuestionPage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('*, profiles!questions_user_id_fkey(username, display_name, active_title_id)')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()

  if (qErr) console.error('question fetch error:', JSON.stringify(qErr))
  if (!question) notFound()

  const { data: answers } = await supabase
    .from('answers')
    .select('*, profiles(username, display_name, active_title_id)')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  // ビュー数インクリメント（fire and forget）
  supabase
    .from('questions')
    .update({ view_count: question.view_count + 1 })
    .eq('id', question.id)

  const poster = question.profiles as any

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        {/* 質問 */}
        <article className="mb-8">
          <h1 className="text-xl font-bold mb-2">{question.title}</h1>
          <p className="text-xs text-gray-400 mb-4">
            {poster?.display_name ?? poster?.username} ·{' '}
            {new Date(question.created_at).toLocaleDateString('ja-JP')} ·{' '}
            {question.view_count} views
          </p>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {question.body}
          </div>
        </article>

        {/* 回答一覧 */}
        {answers && answers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-4 border-b pb-2">
              回答 ({answers.length})
            </h2>
            <ul className="space-y-6">
              {answers.map((a) => {
                const responder = a.profiles as any
                return (
                  <li
                    key={a.id}
                    className={`p-4 rounded-lg border ${
                      a.is_accepted
                        ? 'border-green-300 bg-green-50'
                        : a.is_ai
                        ? 'border-purple-200 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      {a.is_ai ? (
                        <span className="font-medium text-purple-700">AI (Groq)</span>
                      ) : (
                        <span className="font-medium text-gray-700">
                          {responder?.display_name ?? responder?.username}
                        </span>
                      )}
                      {a.is_accepted && (
                        <span className="text-green-700 font-medium">✓ ベストアンサー</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{a.body}</div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* ステータス表示 */}
        {question.status === 'solved' ? (
          <p className="text-center text-sm text-green-600 py-4">この質問は解決済みです</p>
        ) : question.status === 'open' ? (
          <p className="text-center text-sm text-gray-400 py-4">まだ回答がありません</p>
        ) : null}
      </main>
    </>
  )
}
