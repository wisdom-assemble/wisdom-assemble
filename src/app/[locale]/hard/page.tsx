import Link from 'next/link'
import Header from '@/components/Header'
import HardQuestionList from '@/components/HardQuestionList'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'

export default async function HardQuestPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'unsolved' } = await searchParams
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const [{ data: unsolved }, { data: solved }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, title, slug, created_at, view_count, profiles!questions_user_id_fkey(username, display_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'hard')
      .order('created_at', { ascending: false }),
    supabase
      .from('questions')
      .select('id, title, slug, created_at, updated_at, view_count, profiles!questions_user_id_fkey(username, display_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'solved')
      .not('matched_c_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50),
  ])

  const questions = tab === 'solved' ? (solved ?? []) : (unsolved ?? [])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">高難度質問一覧</h1>
          <p className="text-sm text-gray-500">
            AIも専門家も答えられなかった質問です。あなたの知識で解決できますか？
          </p>
        </div>

        {/* タブ */}
        <div className="flex gap-4 border-b mb-6">
          <Link
            href="/hard?tab=unsolved"
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'unsolved' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            未解決 {unsolved && unsolved.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{unsolved.length}</span>}
          </Link>
          <Link
            href="/hard?tab=solved"
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'solved' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            解決済み {solved && solved.length > 0 && <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{solved.length}</span>}
          </Link>
        </div>

        {questions.length > 0 ? (
          <HardQuestionList questions={questions as any} tab={tab as 'unsolved' | 'solved'} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            {tab === 'solved' ? (
              <p>まだ解決した高難度質問はありません</p>
            ) : (
              <>
                <p>高難度質問はまだありません</p>
                <p className="text-sm mt-1">すべての質問が解決されています</p>
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}
