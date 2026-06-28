'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

const SKILL_OPTIONS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS',
  'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker',
  'AWS', 'Supabase', 'Git', 'Linux', 'セキュリティ',
]

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open:        { label: '受付中',          className: 'bg-blue-50 text-blue-700' },
  ai_answered: { label: 'AI回答済',        className: 'bg-purple-50 text-purple-700' },
  matched:     { label: 'メンバー対応中',   className: 'bg-yellow-50 text-yellow-700' },
  matched_c:   { label: '別メンバー対応中', className: 'bg-orange-50 text-orange-700' },
  solved:      { label: '解決済み',         className: 'bg-green-50 text-green-700' },
  hard:        { label: '🔥みんなで解決',   className: 'bg-red-50 text-red-700' },
}

type Tab = 'profile' | 'myquestions' | 'tasks' | 'review'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [emailNotify, setEmailNotify] = useState(true)
  const [stats, setStats] = useState({ answerCount: 0, hardQuestCount: 0 })
  const [message, setMessage] = useState('')
  const [myQuestions, setMyQuestions] = useState<any[]>([])
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [reviewItems, setReviewItems] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login?next=/profile'); return }

      const [{ data: profile }, { data: questions }, { data: bTasks }, { data: cTasks }, { data: reviewQuestions }] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, skill_tags, is_available, answer_count, hard_quest_count, email_notify')
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
          .select('id, title, slug, status, created_at, answers(id)')
          .eq('user_id', user.id)
          .not('status', 'in', '("solved","hard")')
          .order('created_at', { ascending: false }),
      ])

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setSkills(profile.skill_tags ?? [])
        setIsAvailable(profile.is_available ?? true)
        setEmailNotify(profile.email_notify ?? true)
        setStats({ answerCount: profile.answer_count ?? 0, hardQuestCount: profile.hard_quest_count ?? 0 })
      }
      // 自分が回答済みの質問IDを取得してタスクから除外
      const { data: myAnswers } = await supabase
        .from('answers')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('is_ai', false)
      const answeredQIds = new Set((myAnswers ?? []).map((a: any) => a.question_id))

      setMyQuestions(questions ?? [])
      setMyTasks([...(bTasks ?? []), ...(cTasks ?? [])].filter(q => !answeredQIds.has(q.id)))
      setReviewItems((reviewQuestions ?? []).filter((q: any) => q.answers?.length > 0))
      setLoading(false)
    }
    load()
  }, [])

  function toggleSkill(skill: string) {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function save() {
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, skill_tags: skills, is_available: isAvailable, email_notify: emailNotify })
      .eq('id', user.id)

    setSaving(false)
    setMessage(error ? '保存に失敗しました' : '保存しました')
  }

  if (loading) return <><Header /><div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">読み込み中...</div></>

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto px-4 py-8 w-full">
        <h1 className="text-xl font-bold mb-4">マイページ</h1>

        {/* 実績 */}
        <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.answerCount}</p>
            <p className="text-xs text-gray-500 mt-1">解決した質問</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.hardQuestCount}</p>
            <p className="text-xs text-gray-500 mt-1">高難度クエスト</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{myQuestions.length}</p>
            <p className="text-xs text-gray-500 mt-1">投稿した質問</p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setTab('profile')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'profile' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            プロフィール設定
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors relative ${
              tab === 'tasks' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            あなたへの依頼
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
            回答が届いた質問
            {reviewItems.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {reviewItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('myquestions')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'myquestions' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            投稿した質問 ({myQuestions.length})
          </button>
        </div>

        {tab === 'profile' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="例：田中太郎"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">回答ステータス</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAvailable(true)}
                  className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                    isAvailable ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  ✓ 今日は答えられます
                </button>
                <button
                  onClick={() => setIsAvailable(false)}
                  className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                    !isAvailable ? 'bg-gray-100 border-gray-400 text-gray-700' : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  休憩中
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                得意なこと <span className="text-gray-400 font-normal">（選ぶと質問が届きやすくなります）</span>
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
                <p className="text-sm font-medium text-gray-700">メール通知</p>
                <p className="text-xs text-gray-400 mt-0.5">依頼が届いたときにメールで通知します</p>
              </div>
              <button
                onClick={() => setEmailNotify(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${emailNotify ? 'bg-gray-800' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotify ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2 rounded font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存する'}
            </button>

            {message && (
              <p className={`text-sm text-center ${message.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div>
            {myTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>現在、依頼されている質問はありません</p>
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
                            あなたに依頼
                          </span>
                        </div>
                        {remaining !== null && (
                          <p className="text-xs text-orange-500 mt-0.5">残り {remaining}時間</p>
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
                <p>回答が届いている質問はありません</p>
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
                            <p className="text-xs text-red-500 mt-0.5">📩 回答が届いています — 確認してください</p>
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

        {tab === 'myquestions' && (
          <div>
            {myQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>まだ質問を投稿していません</p>
                <Link href="/questions/new" className="text-sm underline mt-2 inline-block hover:text-gray-600">
                  最初の質問を投稿する
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
                          {new Date(q.created_at).toLocaleDateString('ja-JP')}
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
