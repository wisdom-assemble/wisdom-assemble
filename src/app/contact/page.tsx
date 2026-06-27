'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'

export default function ContactPage() {
  const [category, setCategory] = useState('general')
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(CATEGORIES.find(c => c.value === category)?.label ?? 'お問い合わせ')
    const mailBody = encodeURIComponent(
      `カテゴリ：${CATEGORIES.find(c => c.value === category)?.label}\n返信先：${email}\n\n${body}`
    )
    window.location.href = `mailto:wisdomassemble@gmail.com?subject=${subject}&body=${mailBody}`
    setSent(true)
  }

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto px-4 py-10 w-full">
        <h1 className="text-2xl font-bold mb-2">お問い合わせ</h1>
        <p className="text-sm text-gray-500 mb-8">
          ご質問・不具合報告・アカウント削除依頼などはこちらからご連絡ください。
        </p>

        {sent ? (
          <div className="p-6 bg-green-50 rounded-lg text-center">
            <p className="text-green-700 font-medium mb-2">メールアプリが開きます</p>
            <p className="text-sm text-green-600 mb-4">
              送信内容がメールアプリに自動入力されました。そのまま送信してください。
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
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                返信用メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
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

            <button
              type="submit"
              className="w-full py-2.5 rounded font-medium text-white text-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              メールアプリで送信する
            </button>

            <p className="text-xs text-gray-400 text-center">
              送信内容はメールアプリに自動入力されます。
              そのまま送信してください。
            </p>
          </form>
        )}

        <p className="mt-8 text-xs text-center text-gray-400">
          <Link href="/privacy" className="underline hover:text-gray-600">プライバシーポリシー</Link>
        </p>
      </main>
    </>
  )
}

const CATEGORIES = [
  { value: 'general',  label: '一般的なお問い合わせ' },
  { value: 'bug',      label: '不具合・バグ報告' },
  { value: 'delete',   label: 'アカウント削除依頼' },
  { value: 'content',  label: 'コンテンツの削除依頼' },
  { value: 'other',    label: 'その他' },
]
