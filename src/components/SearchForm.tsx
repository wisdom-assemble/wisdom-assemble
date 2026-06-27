'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchForm({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="キーワードで検索..."
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      />
      <button
        type="submit"
        className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 shrink-0"
      >
        検索
      </button>
    </form>
  )
}
