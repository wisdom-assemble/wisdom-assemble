'use client'

import { useState } from 'react'
import SiteLogo from '@/components/SiteLogo'
import { normalizeForSearch } from '@/lib/tenantNames'
import type { PortalExample, PortalQuestionLink } from '@/components/PortalHome'

type Tenant = {
  tenantId: string
  name: string
  colorTheme: string
  theme?: string | null
  bgColor?: string | null
  href: string
  tagline: string
  tags: string[]
  examples: PortalExample[]
  moreQuestions: PortalQuestionLink[]
}

type Props = {
  tenants: Tenant[]
  searchPlaceholder: string
  noResultsLabel: string
  labels: { aiAnswered: string; bestAnswer: string; seeAll: string }
}

export default function PortalTenantSearch({ tenants, searchPlaceholder, noResultsLabel, labels }: Props) {
  const [query, setQuery] = useState('')
  // tags側は PortalHome で同じ関数を通してある。両側を必ず同じ正規化に通すこと。
  const normalizedQuery = normalizeForSearch(query.trim())

  const visibleTenants = normalizedQuery
    ? tenants.filter((tenant) => tenant.tags.some((tag) => tag.includes(normalizedQuery)))
    : tenants

  return (
    <div>
      {/* 【2026-08-23】検索欄をスクロール追従にする（mtさん指定）。
          top はヘッダーの実測値 --header-h を参照する。Header.tsx が ResizeObserver で
          流し込んでいる値で、ロゴの大きさが違ってもズレない（テナント一覧と同じ方式）。
          ⚠️既定値は 0px。ルートポータルには Header コンポーネントが無く --header-h が
          セットされないため、テナント一覧と同じ 73px を既定にすると「ヘッダーが無いのに
          73px下に貼り付く」＝上に死角ができて、そこを中身が流れていく（実際そうなっていた）。
          将来ルートにヘッダーを付けた場合は --header-h がセットされるので自動で追従する。
          ⚠️ここに数値をベタ書きしないこと。8/22に一覧ページで同じ事故が起きている。
          背景を白で塗らないと、下のカードが透けて文字が重なる。 */}
      <div className="sticky top-[var(--header-h,0px)] z-[9] bg-white pt-1 pb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        />
      </div>

      {visibleTenants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{noResultsLabel}</p>
      ) : (
        /* 【2026-10-07】カードに回答例（AIが答えた例・人間が答えた例）を載せたので、正方形の2列から
           スマホ1列・PC2列に変更。カード全体を1つのリンクにすると回答例のリンクと入れ子になる（<a>の中に<a>は不正）ので、
           ロゴ部分・回答例・一覧へ の3つを別々のリンクにしている。
           カードは subgrid（3段＝ロゴ／回答例＋ほかの質問／一覧へ）にして、ロゴの大きさや説明文の行数が違っても
           横に並んだカード同士で段の高さがそろうようにしている（固定のmin-hだと言語ごとに崩れる）。 */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleTenants.map((tenant) => {
            // ダークテナントのカードは data-theme="dark" を付けるだけで、内部の
            // text-gray/border-gray/hover が globals.css のダーク層で自動追従する。
            // 背景は bg_color（未指定なら既定の暗色）。100テナント時の見た目の変化用。
            const isDark = tenant.theme === 'dark'
            const cardBg = isDark ? (tenant.bgColor || '#14161a') : tenant.bgColor
            return (
              <div
                key={tenant.tenantId}
                data-theme={isDark ? 'dark' : undefined}
                style={cardBg ? { backgroundColor: cardBg } : undefined}
                className="grid grid-rows-subgrid row-span-3 gap-y-0 grid-cols-[minmax(0,1fr)] min-w-0 border border-gray-200 rounded-lg overflow-hidden"
              >
                <a
                  href={tenant.href}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center hover:bg-gray-50 transition-colors"
                >
                  <SiteLogo name={tenant.name} tenantId={tenant.tenantId} colorTheme={tenant.colorTheme} />
                  <span className="text-xs text-gray-500 leading-relaxed">{tenant.tagline}</span>
                </a>
                {/* 回答例が無くても div は置く（subgridの段数を3に保つため） */}
                <div>
                <ul className={tenant.examples.length > 0 ? 'border-t border-gray-200 divide-y divide-gray-100' : undefined}>
                  {tenant.examples.map((example) => (
                    <li key={example.kind}>
                      <a href={example.href} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          {example.kind === 'ai' ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              {labels.aiAnswered}
                            </span>
                          ) : (
                            <>
                              {example.answererName && (
                                <span className="text-[11px] text-gray-500">{example.answererName}</span>
                              )}
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                {labels.bestAnswer}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 [overflow-wrap:anywhere]">{example.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1 [overflow-wrap:anywhere]">{example.excerpt}</p>
                      </a>
                    </li>
                  ))}
                </ul>
                {tenant.moreQuestions.length > 0 && (
                  <ul className="border-t border-gray-100 px-4 py-2.5 space-y-1.5">
                    {tenant.moreQuestions.map((q) => (
                      <li key={q.href} className="flex gap-1.5 text-xs leading-snug">
                        <span aria-hidden="true" className="text-gray-300">•</span>
                        <a href={q.href} className="text-gray-700 hover:text-gray-900 hover:underline line-clamp-1">{q.title}</a>
                      </li>
                    ))}
                  </ul>
                )}
                </div>
                <a
                  href={tenant.href}
                  className="border-t border-gray-200 px-4 py-2.5 text-center text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  {labels.seeAll} →
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
