'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/components/TenantProvider'

export default function SignupPage() {
  const t = useTranslations('signupPage')
  const tenant = useTenant()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
      },
    })

    if (error) {
      console.error('signup error:', error)
      setError(error.message || t('signupFailed'))
      setLoading(false)
    } else {
      // 確認メール不要の場合はそのままトップへ
      window.location.href = '/'
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-2xl mb-2">📬</p>
          <h2 className="font-bold text-lg mb-2">{t('confirmEmailTitle')}</h2>
          <p className="text-sm text-gray-500">
            {t('confirmEmailBody', { email })}<br />
            {t('confirmEmailBodyLine2')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
          {tenant?.name ?? 'Wisdom Assemble'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">{t('heading')}</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('usernameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('passwordLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="underline" style={{ color: 'var(--color-primary)' }}>
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
