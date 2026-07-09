import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  // デフォルトロケールも含め、常にURLに/en・/jaを表示する（as-needed不採用）
  localePrefix: 'always',
})
