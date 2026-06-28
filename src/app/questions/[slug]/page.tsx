import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import AnswerForm from '@/components/AnswerForm'
import { AcceptButton, GiveUpButton, RematchButton, EscalateHardButton } from '@/components/QuestionActions'
import OwnerReviewTracker from '@/components/OwnerReviewTracker'
import { getTenantId } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ result?: string }> }

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
  return { title: q.title, description: q.body.slice(0, 160) }
}

export default async function QuestionPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const { result: resultParam } = await searchParams
  const slug = decodeURIComponent(rawSlug)
  const tenantId = await getTenantId()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('*, profiles!questions_user_id_fkey(username, display_name), matched_b_id, matched_b_deadline, matched_c_id, matched_c_deadline')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()

  if (qErr) console.error('question fetch error:', JSON.stringify(qErr))
  if (!question) notFound()

  const { data: answers } = await supabase
    .from('answers')
    .select('*, profiles(username, display_name)')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  // ビュー数インクリメント（fire and forget）
  supabase.from('questions').update({ view_count: question.view_count + 1 }).eq('id', question.id)

  const poster = question.profiles as any
  const isOwner = user?.id === question.user_id
  const isSolved = question.status === 'solved'
  const isHard = question.status === 'hard'
  const isOpen = question.status === 'open'
  const isMatchedC = question.status === 'matched_c'
  const hasAnswers = (answers?.length ?? 0) > 0
  // Bが回答済み → 別メンバーに依頼できる（高難度はまだ出さない）
  const canRematch = isOwner && !isSolved && isOpen && question.matched_b_id && hasAnswers
  // Cが回答済み or C段階で答え待ち → 高難度移行のみ
  const canEscalateHard = isOwner && !isSolved && !isHard && isMatchedC && hasAnswers

  // 期限切れチェック
  const bExpired = question.matched_b_deadline && new Date(question.matched_b_deadline) < new Date()
  const cExpired = question.matched_c_deadline && new Date(question.matched_c_deadline) < new Date()

  // マッチングされた本人かどうか
  const isMatchedB = user?.id === question.matched_b_id && isOpen && !bExpired
  const isMatchedCUser = user?.id === question.matched_c_id && isMatchedC && !cExpired

  // 自分がすでに回答済みか
  const alreadyAnswered = user
    ? (answers ?? []).some((a: any) => a.user_id === user.id && !a.is_ai)
    : false

  // 回答フォームを表示すべきか（マッチングされた本人 かつ 未回答）
  const showAnswerForm = (isMatchedB || isMatchedCUser) && !isSolved && !alreadyAnswered

  // 投稿直後のみ：類似の解決済み質問を取得
  let similarQuestions: { id: string; title: string; slug: string }[] = []
  if (resultParam) {
    const keywords = question.title
      .split(/[\s　、。？！,.!?]+/)
      .filter((w: string) => w.length >= 2)
      .slice(0, 5)
    if (keywords.length > 0) {
      const orFilter = keywords.map((k: string) => `title.ilike.%${k}%`).join(',')
      const { data: similar } = await supabase
        .from('questions')
        .select('id, title, slug')
        .eq('tenant_id', tenantId)
        .eq('status', 'solved')
        .neq('id', question.id)
        .or(orFilter)
        .limit(4)
      similarQuestions = similar ?? []
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">

        {/* オーナーが訪問したら既読マーク */}
        {isOwner && hasAnswers && <OwnerReviewTracker questionId={question.id} />}

        {/* 投稿直後バナー */}
        {resultParam === 'ai' && (
          <div className="mb-5 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-purple-800">AIが回答しました！</p>
              <p className="text-xs text-purple-600 mt-0.5">下の回答をご確認ください。解決したら「ベストアンサー」を押してください。</p>
            </div>
          </div>
        )}
        {resultParam === 'matched' && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-2xl">🙌</span>
            <div>
              <p className="text-sm font-semibold text-green-800">メンバーにマッチングしました！</p>
              <p className="text-xs text-green-600 mt-0.5">回答が届くまでしばらくお待ちください（通常24時間以内）。</p>
            </div>
          </div>
        )}
        {resultParam === 'pending' && (
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">質問を受け付けました</p>
              <p className="text-xs text-blue-600 mt-0.5">しばらくお待ちください。このページをリロードすると状況を確認できます。</p>
            </div>
          </div>
        )}

        {/* 類似の解決済み質問 */}
        {similarQuestions.length > 0 && (
          <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 mb-2">💡 似た質問が解決しています — 参考になるかも</p>
            <ul className="space-y-1">
              {similarQuestions.map(q => (
                <li key={q.id}>
                  <a
                    href={`/questions/${q.slug}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {q.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 質問 */}
        <article className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={question.status} matchedBId={question.matched_b_id} ownerWaiting={isOwner && hasAnswers && !isSolved} />
          </div>
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

        {/* 高難度クエストバナー */}
        {isHard && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">🔥 高難度クエスト</p>
            <p className="text-xs text-red-700 mt-1">
              AIも人間2人も解決できなかった質問です。あなたの知識・経験で助けてください。
            </p>
          </div>
        )}

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

                    {/* 質問者：ベストアンサーボタン */}
                    {isOwner && !isSolved && !a.is_accepted && (
                      <AcceptButton questionId={question.id} answerId={a.id} />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* マッチング待ち（自分はBでもCでもない場合） */}
        {isOpen && question.matched_b_id && !isSolved && user && !isOwner && !showAnswerForm && (
          <div className="border-t pt-6 p-4 bg-gray-50 rounded text-sm text-gray-500 text-center">
            {alreadyAnswered
              ? '✓ 回答しました。質問者の確認をお待ちください。'
              : '現在、専門家にマッチング中です。しばらくお待ちください。'}
          </div>
        )}
        {isMatchedC && question.matched_c_id && !isSolved && user && !isOwner && !showAnswerForm && (
          <div className="border-t pt-6 p-4 bg-gray-50 rounded text-sm text-gray-500 text-center">
            {alreadyAnswered
              ? '✓ 回答しました。質問者の確認をお待ちください。'
              : '現在、専門家にマッチング中です。しばらくお待ちください。'}
          </div>
        )}
        {/* matched_b_id/c_id がnull = 候補者なしで止まっている → hardと同じ扱いで全員に開放 */}
        {((isOpen && !question.matched_b_id) || (isMatchedC && !question.matched_c_id)) && !isSolved && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">🔥 専門家を募集中</p>
            <p className="text-xs text-red-700 mt-1">
              現在マッチングできる専門家がいません。あなたの知識・経験で助けてください。
            </p>
          </div>
        )}
        {((isOpen && !question.matched_b_id) || (isMatchedC && !question.matched_c_id)) && user && !isOwner && !isSolved && (
          <section className="border-t pt-6">
            <AnswerForm questionId={question.id} />
          </section>
        )}

        {/* 回答フォーム（マッチングされた本人のみ） */}
        {showAnswerForm && (
          <section className="border-t pt-6">
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              あなたの知識・経験でこの質問を解決してください。回答をお願いします！
            </div>
            <AnswerForm questionId={question.id} />
            <GiveUpButton questionId={question.id} />
          </section>
        )}

        {/* 高難度クエストの回答フォーム（全員オープン） */}
        {isHard && user && !isOwner && (
          <section className="border-t pt-6">
            <AnswerForm questionId={question.id} />
          </section>
        )}

        {/* 質問者向けアクション（回答が届いているが未解決の場合） */}
        {isOwner && hasAnswers && !isSolved && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            {canRematch && (
              <>
                <p className="text-sm font-medium text-amber-800 mb-1">回答が届いています。解決しましたか？</p>
                <p className="text-xs text-amber-600 mb-3">解決しない場合は別のメンバーに依頼できます（残り1回）。</p>
                <RematchButton questionId={question.id} />
              </>
            )}
            {canEscalateHard && (
              <>
                <p className="text-sm font-medium text-amber-800 mb-1">2人のメンバーが対応しましたが解決しませんでした。</p>
                <p className="text-xs text-amber-600 mb-3">高難度クエストに移行すると全メンバーに公開されます。</p>
                <EscalateHardButton questionId={question.id} />
              </>
            )}
            {!canRematch && !canEscalateHard && (
              <p className="text-sm text-amber-700">回答が届いています。内容を確認してベストアンサーを選んでください。</p>
            )}
          </div>
        )}


        {isSolved && (
          <p className="text-center text-sm text-green-600 py-4">✓ この質問は解決済みです</p>
        )}

        {/* ログインしていない場合 */}
        {!user && (isOpen || isMatchedC || isHard) && (
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            回答するには <a href={`/auth/login?next=/questions/${slug}`} className="underline">ログイン</a> が必要です
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({ status, matchedBId, ownerWaiting }: { status: string; matchedBId?: string | null; ownerWaiting?: boolean }) {
  if (ownerWaiting) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
        あなたの確認待ち
      </span>
    )
  }
  const map: Record<string, { label: string; className: string }> = {
    open:         { label: '受付中',          className: 'bg-blue-50 text-blue-700' },
    open_matched: { label: 'メンバー対応中',   className: 'bg-yellow-50 text-yellow-700' },
    ai_answered:  { label: 'AI回答済み',       className: 'bg-purple-50 text-purple-700' },
    matched:      { label: 'メンバー対応中',   className: 'bg-yellow-50 text-yellow-700' },
    matched_c:    { label: '別メンバー対応中', className: 'bg-orange-50 text-orange-700' },
    solved:       { label: '解決済み',         className: 'bg-green-50 text-green-700' },
    hard:         { label: '🔥みんなで解決',   className: 'bg-red-50 text-red-700' },
  }
  const key = status === 'open' && matchedBId ? 'open_matched' : status
  const { label, className } = map[key] ?? map.open
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
