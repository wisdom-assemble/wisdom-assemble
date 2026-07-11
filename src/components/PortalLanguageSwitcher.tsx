'use client'

// マイページの言語選択と同じ並び・見た目（LANGUAGE_OPTIONSはprofile/page.tsxと揃えてある）
const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
]

type Props = {
  currentLocale: string
  label: string
}

export default function PortalLanguageSwitcher({ currentLocale, label }: Props) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => { window.location.href = `/${opt.code}` }}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              currentLocale === opt.code
                ? 'bg-gray-800 border-gray-800 text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
