import { getTranslations, setRequestLocale } from 'next-intl/server'
import Header from '@/components/Header'
import { buildStaticPageMetadata } from '@/lib/pageMeta'
import { getTenantId } from '@/lib/tenant'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const meta = await buildStaticPageMetadata(locale, '/about', 'portalPage', 'aboutTitle', 'aboutBody')
  // 【2026-10-07】About はルートの運営者情報。テナントにも同じページがあるが（リンクは無い）、
  // 重複にならないよう正規URLはルートのAboutに向ける（テナントのフッターもルートのAboutへリンクしている）
  if ((await getTenantId()) !== 'root') {
    meta.openGraph = { ...meta.openGraph, url: `https://wisdomassemble.com/${locale}/about` }
    meta.alternates = {
      canonical: `https://wisdomassemble.com/${locale}/about`,
      languages: { en: 'https://wisdomassemble.com/en/about', ja: 'https://wisdomassemble.com/ja/about', 'x-default': 'https://wisdomassemble.com/en/about' },
    }
  }
  return meta
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portalPage')
  const tBrand = await getTranslations('brand')
  const tAbout = await getTranslations('aboutPage')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">{t('aboutTitle')}</h1>
        {/* 【2026-08-22】キャッチコピーはタイトルの直下。ルートポータルと同じ扱い・同じサイズ。
            スマホは2行・PCは1行（改行の扱いはPortalHome.tsx側のコメント参照）。
            余白の考え方：見出し(h1)は独立させるので下を広く(mb-6)、コピーと説明文は
            ひとまとまりの本文として近づける(mb-2)。逆にすると説明がタイトルにぶら下がって見える。 */}
        <p className="whitespace-pre-line sm:whitespace-normal text-lg sm:text-xl font-medium text-gray-800 leading-snug mb-2">
          {tBrand('catchcopy')}
        </p>
        <div className="prose prose-sm max-w-none text-sm text-gray-600 leading-relaxed">
          <p>{t('aboutBody')}</p>
        </div>

        {/* 【2026-10-07】立ち上げたきっかけ（mtさん本人の文・日本語は原文のまま。具体を書かないのは意図的＝読む人が自分を重ねられるように）。
            文言は aboutPage 名前空間＝サーバー専用。ブラウザへ送る翻訳（layout の CLIENT_MESSAGE_NAMESPACES）には入れない。
            段落は空行で区切り、段落内の改行（冒頭の2行）はそのまま出す。 */}
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{tAbout('originTitle')}</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            {tAbout('originBody').split('\n\n').map((paragraph, i) => (
              <p key={i} className={i === 0 ? 'whitespace-pre-line text-base text-gray-800 font-medium leading-relaxed' : 'whitespace-pre-line'}>
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-6 text-right text-sm text-gray-500">{tAbout('originSignature')}</p>
        </section>
      </main>
    </>
  )
}
