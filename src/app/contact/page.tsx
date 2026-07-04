'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const [user, setUser] = useState<any>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (subject.trim().length < 10 || body.trim().length < 20) return
    const encodedSubject = encodeURIComponent(subject || 'お問い合わせ')
    const mailBody = encodeURIComponent(`送信者：${user?.email ?? '不明'}\n\n${body}`)
    window.location.href = `mailto:wisdomassemble@gmail.com?subject=${encodedSubject}&body=${mailBody}`
    setSent(true)
  }

  if (loading) return <><Header /><div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">読み込み中...</div></>

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">お問い合わせ</h1>
        <p className="text-sm text-gray-500 mb-6">
          お問い合わせがある場合はこちらからどうぞ。
        </p>

        {/* 免責・注意書き */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <p>・ お問い合わせへの返信はできない場合があり、必ずしも返信を保証するものではございません。</p>
        </div>

        {!user ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-sm text-amber-800 font-medium mb-3">お問い合わせにはログインが必要です</p>
            <a
              href="/auth/login?next=/contact"
              className="inline-block px-4 py-2 rounded text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Googleでログイン
            </a>
          </div>
        ) : sent ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium mb-2">メールアプリが開きます</p>
            <p className="text-sm text-green-600 mb-4">
              送信内容が自動入力されました。そのまま送信してください。
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm underline text-gray-500 hover:text-gray-700"
            >
              フォームに戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">件名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="例：ログインできない / 機能追加の提案"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              {subject.trim().length > 0 && subject.trim().length < 10 && (
                <p className="text-xs text-red-500 mt-1">件名は10文字以上入力してください（現在{subject.trim().length}文字）</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">送信者</label>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <textarea
                required
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="お問い合わせ内容を入力してください"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 resize-none"
              />
            </div>

            {body.trim().length > 0 && body.trim().length < 20 && (
              <p className="text-xs text-red-500">内容は20文字以上入力してください（現在{body.trim().length}文字）</p>
            )}
            <button
              type="submit"
              disabled={subject.trim().length < 10 || body.trim().length < 20}
              className="w-full py-2.5 rounded font-medium text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              送信する
            </button>
          </form>
        )}
      </main>
    </>
  )
}
