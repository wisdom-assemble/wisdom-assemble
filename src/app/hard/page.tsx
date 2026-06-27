import Link from 'next/link'
import Header from '@/components/Header'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'

export default async function HardQuestPage() {
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, title, slug, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'hard')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1">🔥 高難度クエストボード</h1>
          <p className="text-sm text-gray-500">
            AIも人間2人も答えられなかった質問です。あなたの知識で解決できますか？
          </p>
        </div>

        {questions && questions.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium shrink-0">
                          高難度
                        </span>
                        <p className="font-medium text-gray-900 truncate">{q.title}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {(q.profiles as any)?.display_name ?? (q.profiles as any)?.username} ·{' '}
                        {new Date(q.created_at).toLocaleDateString('ja-JP')} ·{' '}
                        {q.view_count} views
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>高難度クエストはまだありません</p>
            <p className="text-sm mt-1">すべての質問がAIまたは人間によって解決されています 🎉</p>
          </div>
        )}
      </main>
    </>
  )
}
