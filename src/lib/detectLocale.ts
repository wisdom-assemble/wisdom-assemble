// 【2026-10-07】投稿の「元の言語」を本文の文字の種類で判定する。
// それまでは画面の表示言語をそのまま元の言語にしていたため、/en の画面から日本語で投稿すると
// 「元が英語」扱いになって英訳が作られず、インデックス対象の /en ページに日本語本文が出ていた。
// 文字の種類で確実に分かるもの（かな＝日本語、ハングル＝韓国語、かな無しの漢字＝中国語、ベトナム語の声調記号）だけ判定し、
// ラテン文字の言語（英・西・葡・尼）は区別できないので、表示言語がそのどれかならそれを使う（日中韓の画面からなら英語とみなす）。
const LATIN_UI_LOCALES = ['en', 'es', 'pt', 'id', 'vi']

export function detectSourceLocale(text: string, uiLocale: string, supported: readonly string[]): string {
  const fallback = supported.includes(uiLocale) ? uiLocale : 'ja'
  if (/[぀-ヿ]/.test(text)) return 'ja'
  if (/[가-힯ᄀ-ᇿ]/.test(text)) return 'ko'
  if (/[一-鿿]/.test(text)) return 'zh'
  if (/[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđĐ]/.test(text)) return 'vi'
  if (/[A-Za-z]/.test(text)) return LATIN_UI_LOCALES.includes(fallback) ? fallback : 'en'
  return fallback
}
