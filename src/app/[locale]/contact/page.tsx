'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const t = useTranslations('contactPage')
  const tCommon = useTranslations('common')
  const tHeader = useTranslations('header')
  const [user, setUser] = useState<any>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (subject.trim().length < 10 || body.trim().length < 20) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('submitFailed'))
        return
      }
      setSent(true)
      setSubject('')
      setBody('')
    } catch {
      setError(t('submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    window.location.reload()
  }

  if (loading) return <><Header /><div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">{tCommon('loading')}</div></>

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('subtitle')}
        </p>

        {/* 免責・注意書き */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <p>{t('disclaimer')}</p>
        </div>

        {!user ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-sm text-amber-800 font-medium mb-3">{t('loginRequired')}</p>
            <a
              href="/auth/login?next=/contact"
              className="inline-block px-4 py-2 rounded text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {t('googleLogin')}
            </a>
          </div>
        ) : sent ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-medium mb-2">{t('sentTitle')}</p>
            <p className="text-sm text-green-600 mb-4">
              {t('sentBody')}
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm underline text-gray-500 hover:text-gray-700"
            >
              {t('backToForm')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('subjectLabel')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={t('subjectPlaceholder')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              {subject.trim().length > 0 && subject.trim().length < 10 && (
                <p className="text-xs text-red-500 mt-1">{t('subjectTooShort', { count: subject.trim().length })}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">{t('senderLabel')}</label>
                <button type="button" onClick={handleLogout} className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 underline">
                  {tHeader('logout')}
                </button>
              </div>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('bodyLabel')}</label>
              <textarea
                required
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={t('bodyPlaceholder')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 resize-none"
              />
            </div>

            {body.trim().length > 0 && body.trim().length < 20 && (
              <p className="text-xs text-red-500">{t('bodyTooShort', { count: body.trim().length })}</p>
            )}
            <button
              type="submit"
              disabled={submitting || subject.trim().length < 10 || body.trim().length < 20}
              className="w-full py-2.5 rounded font-medium text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </form>
        )}
      </main>
    </>
  )
}
