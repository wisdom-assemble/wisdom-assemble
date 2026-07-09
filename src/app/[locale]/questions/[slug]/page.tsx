import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import Header from '@/components/Header'
import AnswerForm from '@/components/AnswerForm'
import { AcceptButton, GiveUpButton, RematchButton, EscalateHardButton } from '@/components/QuestionActions'
import OwnerReviewTracker from '@/components/OwnerReviewTracker'
import TranslatedQuestionBody from '@/components/TranslatedQuestionBody'
import TranslatedAnswerBody from '@/components/TranslatedAnswerBody'
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
  const t = await getTranslations('questionPage')
  const tTitles = await getTranslations('titles')
  const locale = await getLocale()
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
    .select('*, profiles(username, display_name, active_title_id)')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true })

  // 回答者のアクティブ称号を取得
  const activeTitleIds = [...new Set(
    (answers ?? []).map((a: any) => a.profiles?.active_title_id).filter(Boolean)
  )]
  const titleMap: Record<string, string> = {}
  if (activeTitleIds.length > 0) {
    const { data: titleRows } = await supabase
      .from('titles')
      .select('id, name')
      .in('id', activeTitleIds)
    for (const row of titleRows ?? []) titleMap[row.id] = tTitles.has(row.id) ? tTitles(row.id) : row.name
  }

  // ビュー数インクリメント（fire and forget）
  supabase.from('questions').update({ view_count: question.view_count + 1 }).eq('id', question.id)

  const poster = question.profiles as any
  const isOwner = user?.id === question.user_id
  const isSolved = question.status === 'solved'
  const isHard = question.status === 'hard'
  const isOpen = question.status === 'open'
  const isMatchedC = question.status === 'matched_c'
  const hasAnswers = (answers?.length ?? 0) > 0
  // Cが実際に回答したかどうか
  const hasCAnswer = isMatchedC && question.matched_c_id
    ? (answers ?? []).some((a: any) => a.user_id === question.matched_c_id)
    : false
  // 期限切れチェック
  const bExpired = question.matched_b_deadline && new Date(question.matched_b_deadline) < new Date()
  const cExpired = question.matched_c_deadline && new Date(question.matched_c_deadline) < new Date()

  // Bが回答済み or 期限切れ → 次の専門家に依頼 or 高難度昇格が選べる
  const canRematch = isOwner && !isSolved && isOpen && question.matched_b_id && (hasAnswers || !!bExpired)
  // Cが回答済みの場合のみ高難度移行ボタンを表示（絶対ルール）
  const canEscalateHard = isOwner && !isSolved && !isHard && isMatchedC && hasCAnswer

  // マッチングされた本人かどうか
  const isMatchedB = user?.id === question.matched_b_id && isOpen && !bExpired
  const isMatchedCUser = user?.id === question.matched_c_id && isMatchedC && !cExpired

  // 期限切れ専門家かどうか（UI表示用）
  const isExpiredMatchedB = user?.id === question.matched_b_id && isOpen && !!bExpired
  const isExpiredMatchedCUser = user?.id === question.matched_c_id && isMatchedC && !!cExpired

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
            <span className="text-lg font-bold text-purple-700">{t('aiLabel')}</span>
            <div>
              <p className="text-sm font-semibold text-purple-800">{t('aiAnsweredTitle')}</p>
              <p className="text-xs text-purple-600 mt-0.5">{t('aiAnsweredBody')}</p>
            </div>
          </div>
        )}
        {resultParam === 'matched' && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-lg font-bold text-green-700">●</span>
            <div>
              <p className="text-sm font-semibold text-green-800">{t('matchedTitle')}</p>
              <p className="text-xs text-green-600 mt-0.5">{t('matchedBody')}</p>
            </div>
          </div>
        )}
        {resultParam === 'pending' && (
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="text-lg font-bold text-blue-700">●</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">{t('pendingTitle')}</p>
              <p className="text-xs text-blue-600 mt-0.5">{t('pendingBody')}</p>
            </div>
          </div>
        )}

        {/* 類似の解決済み質問 */}
        {similarQuestions.length > 0 && (
          <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 mb-2">{t('similarSolved')}</p>
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
            <StatusBadge status={question.status} matchedBId={question.matched_b_id} ownerWaiting={isOwner && hasAnswers && !isSolved} t={t} />
          </div>
          <TranslatedQuestionBody
            title={question.title}
            translatedTitle={question.title_i18n?.[locale] ?? null}
            body={question.body}
            translatedBody={question.body_i18n?.[locale] ?? null}
            meta={
              <p className="text-xs text-gray-400 mb-4">
                {poster?.display_name ?? poster?.username} ·{' '}
                {new Date(question.created_at).toLocaleDateString(locale)} ·{' '}
                {question.view_count} {t('views')}
              </p>
            }
            notice={t('translationNotice')}
            showOriginalLabel={t('showOriginal')}
            showTranslationLabel={t('showTranslation')}
          />
        </article>

        {/* 高難度クエストバナー */}
        {isHard && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{t('hardBannerTitle')}</p>
            <p className="text-xs text-red-700 mt-1">
              {t('hardBannerBody')}
            </p>
          </div>
        )}

        {/* 回答一覧 */}
        {answers && answers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-4 border-b pb-2">
              {t('answersHeading', { count: answers.length })}
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
                        <span className="font-medium text-purple-700">{t('aiLabel')}</span>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">
                            {responder?.display_name ?? responder?.username}
                          </span>
                          {responder?.active_title_id && titleMap[responder.active_title_id] && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {titleMap[responder.active_title_id]}
                            </span>
                          )}
                        </>
                      )}
                      {a.is_accepted && (
                        <span className="text-green-700 font-medium">{t('bestAnswer')}</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString(locale)}</span>
                    </div>
                    <TranslatedAnswerBody
                      body={a.body}
                      translatedBody={a.body_i18n?.[locale] ?? null}
                      notice={t('translationNotice')}
                      showOriginalLabel={t('showOriginal')}
                      showTranslationLabel={t('showTranslation')}
                    />

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

        {/* 期限切れ専門家向けメッセージ */}
        {(isExpiredMatchedB || isExpiredMatchedCUser) && !isSolved && (
          <div className="border-t pt-6 p-4 bg-gray-100 rounded text-sm text-gray-500 text-center">
            {t('expiredMessage')}
          </div>
        )}

        {/* マッチング待ち（自分はBでもCでもない場合） */}
        {isOpen && question.matched_b_id && !isSolved && user && !isOwner && !showAnswerForm && !isExpiredMatchedB && (alreadyAnswered || !bExpired) && (
          <div className="border-t pt-6 p-4 bg-gray-50 rounded text-sm text-gray-500 text-center">
            {alreadyAnswered ? t('alreadyAnswered') : t('waitingForMatch')}
          </div>
        )}
        {isMatchedC && question.matched_c_id && !isSolved && user && !isOwner && !showAnswerForm && !isExpiredMatchedCUser && (alreadyAnswered || !cExpired) && (
          <div className="border-t pt-6 p-4 bg-gray-50 rounded text-sm text-gray-500 text-center">
            {alreadyAnswered ? t('alreadyAnswered') : t('waitingForMatch')}
          </div>
        )}
        {/* matched_b_id/c_id がnull = 候補者なしで止まっている → hardと同じ扱いで全員に開放 */}
        {((isOpen && !question.matched_b_id) || (isMatchedC && !question.matched_c_id)) && !isSolved && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{t('noExpertBannerTitle')}</p>
            <p className="text-xs text-red-700 mt-1">
              {t('noExpertBannerBody')}
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
              {t('askToAnswer')}
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

        {/* 質問者向けアクション（回答が届いているか期限切れで未解決の場合） */}
        {isOwner && !isSolved && (canRematch || canEscalateHard || isMatchedC) && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            {canRematch && (
              <>
                {hasAnswers ? (
                  <>
                    <p className="text-sm font-medium text-amber-800 mb-1">{t('ownerRematchHasAnswerTitle')}</p>
                    <p className="text-xs text-amber-600 mb-3">{t('ownerRematchHasAnswerBody')}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-amber-800 mb-1">{t('ownerRematchNoAnswerTitle')}</p>
                    <p className="text-xs text-amber-600 mb-3">{t('ownerRematchNoAnswerBody')}</p>
                  </>
                )}
                <RematchButton questionId={question.id} />
                <EscalateHardButton questionId={question.id} />
              </>
            )}
            {canEscalateHard && (
              <>
                <p className="text-sm font-medium text-amber-800 mb-1">{t('ownerEscalateTitle')}</p>
                <p className="text-xs text-amber-600 mb-3">{t('ownerEscalateBody')}</p>
                <EscalateHardButton questionId={question.id} />
              </>
            )}
            {!canRematch && !canEscalateHard && isMatchedC && (
              <p className="text-sm text-amber-700">{t('ownerMatchedCWaiting')}<br /><span className="text-xs text-amber-600">{t('ownerMatchedCWaitingNote')}</span></p>
            )}
            {!canRematch && !canEscalateHard && !isMatchedC && (
              <p className="text-sm text-amber-700">{t('ownerHasAnswers')}</p>
            )}
          </div>
        )}


        {isSolved && (
          <p className="text-center text-sm text-green-600 py-4">{t('solved')}</p>
        )}

        {/* ログインしていない場合 */}
        {!user && (isOpen || isMatchedC || isHard) && (
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            {t('loginRequired')} <a href={`/auth/login?next=/questions/${slug}`} className="underline">{t('loginLink')}</a> {t('loginRequiredSuffix')}
          </div>
        )}
      </main>
    </>
  )
}

function StatusBadge({ status, matchedBId, ownerWaiting, t }: { status: string; matchedBId?: string | null; ownerWaiting?: boolean; t: Awaited<ReturnType<typeof getTranslations>> }) {
  if (ownerWaiting) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
        {t('youAreWaitingReview')}
      </span>
    )
  }
  const map: Record<string, { label: string; className: string }> = {
    open:         { label: t('statusOpen'),          className: 'bg-blue-50 text-blue-700' },
    open_matched: { label: t('statusOpenMatched'),    className: 'bg-yellow-50 text-yellow-700' },
    ai_answered:  { label: t('statusAiAnswered'),     className: 'bg-purple-50 text-purple-700' },
    matched:      { label: t('statusMatched'),        className: 'bg-yellow-50 text-yellow-700' },
    matched_c:    { label: t('statusMatchedC'),       className: 'bg-orange-50 text-orange-700' },
    solved:       { label: t('statusSolved'),         className: 'bg-green-50 text-green-700' },
    hard:         { label: t('statusHard'),           className: 'bg-red-50 text-red-700' },
  }
  const key = status === 'open' && matchedBId ? 'open_matched' : status
  const { label, className } = map[key] ?? map.open
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
