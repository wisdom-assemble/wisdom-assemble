'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

const SKILL_OPTIONS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS',
  'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker',
  'AWS', 'Supabase', 'Git', 'Linux', 'セキュリティ',
]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [stats, setStats] = useState({ answerCount: 0, hardQuestCount: 0 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, skill_tags, is_available, answer_count, hard_quest_count')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setSkills(profile.skill_tags ?? [])
        setIsAvailable(profile.is_available ?? true)
        setStats({ answerCount: profile.answer_count ?? 0, hardQuestCount: profile.hard_quest_count ?? 0 })
      }
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
      .update({ display_name: displayName.trim() || null, skill_tags: skills, is_available: isAvailable })
      .eq('id', user.id)

    setSaving(false)
    setMessage(error ? '保存に失敗しました' : '保存しました')
  }

  if (loading) return <><Header /><div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">読み込み中...</div></>

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto px-4 py-8 w-full">
        <h1 className="text-xl font-bold mb-6">プロフィール</h1>

        {/* 実績 */}
        <div className="flex gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.answerCount}</p>
            <p className="text-xs text-gray-500 mt-1">解決した質問</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.hardQuestCount}</p>
            <p className="text-xs text-gray-500 mt-1">高難度クエスト</p>
          </div>
        </div>

        {/* 表示名 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="例：田中太郎"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        {/* 回答ステータス */}
        <div className="mb-6">
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

        {/* スキルタグ */}
        <div className="mb-8">
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

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2 rounded font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存する'}
        </button>

        {message && (
          <p className={`mt-3 text-sm text-center ${message.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </main>
    </>
  )
}
