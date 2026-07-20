import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ja', 'zh', 'id', 'vi', 'ko', 'es', 'pt'],
  defaultLocale: 'en',
  // デフォルトロケールも含め、常にURLに/en・/jaを表示する（as-needed不採用）
  localePrefix: 'always',
})

// 検索エンジンにインデックスさせるロケール。en/jaのみを対象とし、他6言語
// (zh/id/vi/ko/es/pt) は「人間レビューを経ていない機械翻訳ページ」なので
// noindex＋sitemap除外にする（Googleのscaled content abuse対策）。翻訳データ自体は
// 保持したままなので、各言語で人力レビュー/流入実績が出たらここに追加して解禁できる。
export const INDEXABLE_LOCALES: readonly string[] = ['en', 'ja']
