'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter as useIntlRouter } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

const SKILL_OPTIONS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS',
  'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker',
  'AWS', 'Supabase', 'Git', 'Linux', 'セキュリティ',
]

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
]

type Tab = 'profile' | 'myquestions' | 'tasks' | 'review' | 'solved'

export default function ProfilePage() {
  const t = useTranslations('profilePage')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const supabase = createClient()
  const router = useRouter()
  const intlRouter = useIntlRouter()

  const STATUS_MAP: Record<string, { label: string; className: string }> = {
    open:        { label: t('statusOpen'),        className: 'bg-blue-50 text-blue-700' },
    ai_answered: { label: t('statusAiAnswered'),   className: 'bg-purple-50 text-purple-700' },
    matched:     { label: t('statusMatched'),      className: 'bg-yellow-50 text-yellow-700' },
    matched_c:   { label: t('statusMatchedC'),     className: 'bg-orange-50 text-orange-700' },
    solved:      { label: t('statusSolved'),       className: 'bg-green-50 text-green-700' },
    hard:        { label: t('statusHard'),         className: 'bg-red-50 text-red-700' },
  }

  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [emailNotify, setEmailNotify] = useState(true)
  const [language, setLanguage] = useState(locale)
  const [stats, setStats] = useState({ answerCount: 0, hardQuestCount: 0 })
  const [titles, setTitles] = useState<{ id: string; name: string; rarity: string }[]>([])
  const [activeTitle, setActiveTitle] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [myQuestions, setMyQuestions] = useState<any[]>([])
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [reviewItems, setReviewItems] = useState<any[]>([])
  const [solvedAnswers, setSolvedAnswers] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login?next=/profile'); return }
      setUserEmail(user.email ?? '')

      const [{ data: profile }, { data: questions }, { data: bTasks }, { data: cTasks }, { data: reviewQuestions }, { data: userTitles }, { data: solvedAnswerRows }] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, skill_tags, is_available, answer_count, hard_quest_count, email_notify, active_title_id, language')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('questions')
          .select('id, title, slug, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('questions')
          .select('id, title, slug, status, created_at, matched_b_deadline')
          .eq('matched_b_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('id, title, slug, status, created_at, matched_c_deadline')
          .eq('matched_c_id', user.id)
          .eq('status', 'matched_c')
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('id, title, slug, status, created_at, owner_reviewed_at, answers(id, created_at)')
          .eq('user_id', user.id)
          .not('status', 'in', '("solved","hard")')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_titles')
          .select('title_id')
          .eq('user_id', user.id),
        supabase
          .from('answers')
          .select('id, created_at, questions(id, title, slug)')
          .eq('user_id', user.id)
          .eq('is_accepted', true)
          .eq('is_ai', false)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setSkills(profile.skill_tags ?? [])
        setIsAvailable(profile.is_available ?? true)
        setEmailNotify(profile.email_notify ?? true)
        setStats({ answerCount: profile.answer_count ?? 0, hardQuestCount: profile.hard_quest_count ?? 0 })
        setActiveTitle(profile.active_title_id ?? null)
        if (profile.language) setLanguage(profile.language)
      }
      if (userTitles && userTitles.length > 0) {
        const titleIds = userTitles.map((ut: any) => ut.title_id)
        const { data: titleData } = await supabase
          .from('titles')
          .select('id, name, rarity')
          .in('id', titleIds)
        setTitles(titleData ?? [])
      }
      // 自分が回答済みの質問IDを取得してタスクから除外
      const { data: myAnswers } = await supabase
        .from('answers')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_ai', false)
      const answeredQIds = new Set((myAnswers ?? []).map((a: any) => a.question_id))

      const now = new Date()
      const bPending = (bTasks ?? []).filter((q: any) => !q.matched_b_deadline || new Date(q.matched_b_deadline) > now)
      const cPending = (cTasks ?? []).filter((q: any) => !q.matched_c_deadline || new Date(q.matched_c_deadline) > now)

      setMyQuestions(questions ?? [])
      setSolvedAnswers(solvedAnswerRows ?? [])
      setMyTasks([...bPending, ...cPending].filter(q => !answeredQIds.has(q.id)))
      setReviewItems((reviewQuestions ?? []).filter((q: any) => {
        if (!q.answers?.length) return false
        if (!q.owner_reviewed_at) return true
        // 既読後に新しい回答があれば再表示
        return q.answers.some((a: any) => new Date(a.created_at) > new Date(q.owner_reviewed_at))
      }))
      setLoading(false)
    }
    load()
  }, [])

  async function handleTitleClick(titleId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newActive = activeTitle === titleId ? null : titleId
    setActiveTitle(newActive)
    await supabase.from('profiles').update({ active_title_id: newActive }).eq('id', user.id)
  }

  function toggleSkill(skill: string) {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function handleLanguageChange(newLanguage: string) {
    setLanguage(newLanguage)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ language: newLanguage }).eq('id', user.id)
    }
    intlRouter.replace('/profile', { locale: newLanguage })
  }

  async function save() {
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // メアド・URLを含む表示名は拒否
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const urlRegex = /https?:\/\//
    if (emailRegex.test(displayName) || urlRegex.test(displayName)) {
      setMessage(t('displayNameRejected'))
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, skill_tags: skills, is_available: isAvailable, email_notify: emailNotify })
      .eq('id', user.id)

    setSaving(false)
    if (error) console.error('profile save error:', JSON.stringify(error))
    setMessage(error ? t('saveFailed') : t('saveSuccess'))
  }

  if (loading) return <><Header /><div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">{tCommon('loading')}</div></>

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-xs text-gray-400">{userEmail}</p>
        </div>

        {/* 実績 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.answerCount}</p>
              <p className="text-xs text-gray-500 mt-1">{t('solvedQuestions')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.hardQuestCount}</p>
              <p className="text-xs text-gray-500 mt-1">{t('solvedHardQuestions')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{myQuestions.length}</p>
              <p className="text-xs text-gray-500 mt-1">{t('postedQuestions')}</p>
            </div>
          </div>
          {/* 称号バッジ */}
          {titles.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('titlesEarned')}</p>
              <p className="text-xs text-gray-400 mb-2">{t('titlesHint')}</p>
              <div className="flex flex-wrap gap-2">
                {titles.map(t2 => {
                  const rarityStyle = t2.rarity === 'legendary'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : t2.rarity === 'super_rare'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : t2.rarity === 'rare'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : t2.rarity === 'uncommon'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                  const isActive = t2.id === activeTitle
                  return (
                    <button
                      key={t2.id}
                      onClick={() => handleTitleClick(t2.id)}
                      className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer transition-all ${rarityStyle} ${isActive ? 'ring-2 ring-offset-1 ring-gray-500' : 'opacity-70 hover:opacity-100'}`}
                      title={isActive ? t('titleClickToUnselect') : t('titleClickToSelect')}
                    >
                      {isActive && '★ '}{t2.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {titles.length === 0 && stats.answerCount === 0 && (
            <p className="text-xs text-gray-400 mt-2">{t('noTitlesYet')}</p>
          )}
        </div>

        {/* タブ */}
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setTab('profile')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'profile' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabProfile')}
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative ${
              tab === 'tasks' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabTasks')}
            {myTasks.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {myTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('review')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative ${
              tab === 'review' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabReview')}
            {reviewItems.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {reviewItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('solved')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'solved' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabSolved', { count: solvedAnswers.length })}
          </button>
          <button
            onClick={() => setTab('myquestions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'myquestions' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabMyQuestions', { count: myQuestions.length })}
          </button>
        </div>

        {tab === 'profile' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('displayNameLabel')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              {displayName.startsWith('ユーザー#') && (
                <p className="text-xs text-gray-400 mt-1">{t('displayNameHint')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('skillsLabel')} <span className="text-gray-400 font-normal">{t('skillsHint')}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      skills.includes(skill)
                        ? 'bg-gray-800 border-gray-800 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* メール通知 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('emailNotifyLabel')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('emailNotifyHint')}</p>
              </div>
              <button
                onClick={() => setEmailNotify(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${emailNotify ? 'bg-gray-800' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotify ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* 表示言語 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-0.5">{t('languageLabel')}</p>
              <p className="text-xs text-gray-400 mb-3">{t('languageHint')}</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => handleLanguageChange(opt.code)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      language === opt.code ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 rounded font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('saving') : t('save')}
            </button>

            {message && (
              <p className={`text-sm text-center ${message.includes('失敗') || message.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div>
            {myTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{t('noTasks')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {myTasks.map(q => {
                  const deadline = q.matched_b_deadline ?? q.matched_c_deadline
                  const remaining = deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 3600000)) : null
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/questions/${q.slug}`}
                        className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900 flex-1">{q.title}</p>
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                            {t('assignedToYou')}
                          </span>
                        </div>
                        {remaining !== null && (
                          <p className="text-xs text-orange-500 mt-0.5">{t('remainingHours', { hours: remaining })}</p>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'review' && (
          <div>
            {reviewItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{t('noReviewItems')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {reviewItems.map(q => {
                  const s = STATUS_MAP[q.status] ?? STATUS_MAP.open
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/questions/${q.slug}`}
                        className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{q.title}</p>
                            <p className="text-xs text-red-500 mt-0.5">{t('answerArrived')}</p>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'solved' && (
          <div>
            {solvedAnswers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{t('noSolvedYet')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {solvedAnswers.map((a: any) => {
                  const q = a.questions
                  if (!q) return null
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/questions/${q.slug}`}
                        className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                      >
                        <p className="text-sm font-medium text-gray-900">{q.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(a.created_at).toLocaleDateString(locale)} · {t('bestAnswer')}
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'myquestions' && (
          <div>
            {myQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{t('noQuestionsYet')}</p>
                <Link href="/questions/new" className="text-sm underline mt-2 inline-block hover:text-gray-600">
                  {t('postFirstQuestion')}
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {myQuestions.map(q => {
                  const s = STATUS_MAP[q.status] ?? STATUS_MAP.open
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/questions/${q.slug}`}
                        className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900 truncate flex-1">{q.title}</p>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(q.created_at).toLocaleDateString(locale)}
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </main>
    </>
  )
}
