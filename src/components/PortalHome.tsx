import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPublicSubdomain, TENANT_SEARCH_TAGS, TENANT_NAME_MAP, normalizeForSearch } from '@/lib/tenantNames'
import { TENANT_SKILL_OPTIONS } from '@/lib/skillTags'
import PortalTenantSearch from '@/components/PortalTenantSearch'
import PortalLanguageSwitcher from '@/components/PortalLanguageSwitcher'
import WisdomAssembleWordmark from '@/components/WisdomAssembleWordmark'

// AdSense/Stripe Connect審査用バージョンでは、審査を混乱させないよう
// 実際に稼働中の2テナントのみをカード表示する（他ジャンルへの言及なし）。
// 検索バー自体はPortalTenantSearchで維持しつつ、対象を2テナントに絞っている。
// 審査通過後、残りのテナントを追加していく際はこの配列に追加していくだけでよい。
// 掲載するテナント。休眠中(DORMANT_TENANT_IDS)のものはここから外す＝カードが消える。
// 復活させるときは戻すだけでよい（サブドメイン・DBは触らない）。
const REVIEW_TENANT_IDS = ['dtm', 'guitar']

// DB取得が万一失敗した場合の保険（本来はtenants.color_themeが正）
const FALLBACK_COLOR_THEME: Record<string, string> = {
  debug: '#10B981',
  dtm: '#4A90E2',
  guitar: '#a96800',
}

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// wisdomassemble.com（ルートドメイン）専用のポータルページ。
// 各ジャンル別サブドメインへの入口。まだCloudflareのCustom Domain設定が
// 済んでいないテナントは「準備中」バッジを表示し、リンクを無効化する。
export default async function PortalHome() {
  // このコンポーネント単体では動的APIを呼ばないため、呼び出し元次第では
  // 静的レンダリング扱いになりgetTranslations()がdefaultLocaleにフォール
  // バックする可能性がある（既知のnext-intlの罠）。明示的にlocaleを確定させる。
  const locale = await getLocale()
  setRequestLocale(locale)
  const t = await getTranslations('portalPage')
  const tBrand = await getTranslations('brand')
  const tProfile = await getTranslations('profilePage')

  const admin = getAdminClient()
  // page.tsxのタグライン取得と同じ .eq(...).single() の形に揃える
  // （.in()での一括取得だと本番で稀に color_theme が取得できないことがあったため）
  const results = await Promise.all(
    REVIEW_TENANT_IDS.map((tenantId) =>
      admin.from('tenants').select('*').eq('id', tenantId).single()
    )
  )

  /* 【2026-08-23】検索の材料に「実際に投稿された質問のタグ」を足す。
     Fender / ファズ / Klon Centaur / Genelec / MOTU のように、利用者が実際に打ちそうな
     固有名詞はここにしか無い。しかも質問を投稿するたび勝手に増えるので、
     テナントが育つほど検索が強くなり、運用の手間はゼロ。
     ⚠️表示するテナントぶんだけ・上限2000行に絞っている。テナントや質問が大幅に増えて
     ここが重くなったら、タグの集計を別テーブル/ビューに切り出すこと。 */
  const { data: tagRows } = await admin
    .from('questions')
    .select('tenant_id, tags')
    .in('tenant_id', REVIEW_TENANT_IDS)
    .limit(2000)
  const questionTagsByTenant: Record<string, Set<string>> = {}
  for (const row of tagRows ?? []) {
    const set = (questionTagsByTenant[row.tenant_id] ??= new Set<string>())
    for (const tag of (row.tags as string[] | null) ?? []) set.add(String(tag).toLowerCase())
  }

  const cards = REVIEW_TENANT_IDS.map((tenantId, i) => {
    const { data: tenant, error } = results[i]
    if (error) {
      console.error(`[PortalHome] tenants fetch failed for ${tenantId}:`, error.message)
    }
    const label = TENANT_NAME_MAP[tenantId] ?? tenantId
    // タグラインは `{tenantId}CardTagline` の動的キーで取得（3テナント目以降でも壊れない）。
    const tagline = t(`${tenantId}CardTagline` as Parameters<typeof t>[0])
    /* 【2026-08-23】ジャンル検索の対象に「カードの説明文(tagline)」と「DBのテナント名」を追加した。
       それまでの対象は ①英語の表示名 ②テナントID ③TENANT_SEARCH_TAGS の手動タグ だけで、
       guitar は手動タグが1件も登録されていなかったため「ギター」で検索しても出なかった
       （英語で出ていたのはテナントIDの 'guitar' が一致していただけ）。dtm も「ミキシング」はあるが
       「ミックス」が無く出なかった。手動タグは登録漏れが起きる前提で考えるべき仕組みだった。
       tagline は messages/*.json に8言語ぶん必ず書くもので、しかも表示中のロケールの文字列が
       入るので、これを検索対象に入れておけば【新テナントは説明文を書くだけで8言語とも検索に出る】。
       手動タグの方は残す（説明文に出てこない略称・別名・メーカー名などの精度用）。 */
    const tags = [
      label.toLowerCase(),
      tenantId.toLowerCase(),
      (tenant?.name ?? '').toLowerCase(),
      tagline.toLowerCase(),
      /* 【2026-08-23】テナント説明文の「表示中の言語版」。tenants.description_i18n には
         en/zh/id/vi/ko/es/pt が入っており（jaは description 列）、各言語の中核語が必ず含まれる
         （例: ko「기타 및 페달」／es「guitarras y pedales」／vi「guitar và pedal」）。
         tagline と合わせて、これが【全8言語ぶんの自動カバー】になる。
         手動タグを8言語ぶん書き続けるのは登録漏れが必ず起きる（実際 guitar で起きた）ので、
         テナント作成時に必ず作られるデータだけで最低限の検索が成立する状態を作っておく。 */
      (((tenant as { description_i18n?: Record<string, string> | null } | null)?.description_i18n?.[locale])
        ?? (tenant as { description?: string | null } | null)?.description ?? '').toLowerCase(),
      ...(TENANT_SEARCH_TAGS[tenantId] ?? []).map((tag) => tag.toLowerCase()),
      // マイページの「得意なこと」の選択肢。マッチングに必須なので必ず維持されるデータで、
      // エレキギター/アコギ/ピックアップ/真空管アンプ/Ableton Live のような
      // 利用者が実際に打つ語がそろっている。フォールバック（未定義ならdebug）は使わない
      // ――無関係なテナントに React や Python が混ざってしまうため。
      ...(TENANT_SKILL_OPTIONS[tenantId] ?? []).map((tag) => tag.toLowerCase()),
      // 実際に投稿された質問のタグ（自動で増える）
      ...(questionTagsByTenant[tenantId] ?? []),
    ].filter(Boolean).map(normalizeForSearch)
    return {
      tenantId,
      name: tenant?.name ?? tenantId,
      colorTheme: tenant?.color_theme ?? FALLBACK_COLOR_THEME[tenantId],
      theme: (tenant as { theme?: string | null } | null)?.theme ?? null,
      bgColor: (tenant as { bg_color?: string | null } | null)?.bg_color ?? null,
      href: `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com`,
      // ⚠️新テナント追加時は messages/*.json に `{tenantId}CardTagline` を8言語ぶん追加すること。
      // これが検索対象を兼ねているので、書けばその言語で検索に出る。
      tagline,
      tags,
    }
  })

  return (
    <main className="max-w-3xl mx-auto px-4 pt-4 pb-12 sm:pt-10 sm:pb-14 w-full">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="mb-2">
          <WisdomAssembleWordmark fontSize={32} />
        </h1>
        {/* 【2026-08-22】キャッチコピー。説明文ではなくサービスのルールとして、説明より先に見せる。
            改行の扱い：スマホは whitespace-pre-line で文中の改行をそのまま活かして2行。
            PCは sm:whitespace-normal で改行を空白に畳んで1行にする。
            スマホで1行にしてはいけない：全角23文字ぶんあるので375px（本文領域343px）だと
            約15px＝本文より小さくなる。2行なら2行目18文字ぶんで18pxを確保できる。
            サイズはルートが text-lg/xl、テナントは1段小さい text-base/lg（mtさん指定・2026-08-22）。 */}
        <p className="whitespace-pre-line sm:whitespace-normal text-lg sm:text-xl font-medium text-gray-800 leading-snug mb-2">
          {tBrand('catchcopy')}
        </p>
        <p className="text-xs sm:text-[13px] text-gray-500 max-w-lg mx-auto leading-relaxed">{t('subtitle')}</p>
      </div>

      {/* 【2026-08-22】文言を「ジャンルを選んで始めましょう」から問いかけに変更（mtさん指定）。
          ユーザーはジャンルを選びに来るのではなく「〇〇について知りたくて」来る、という考え方。
          英語は "Choose a community to get started" だったが、コミュニティに参加せず気軽に聞ける
          というポジションと矛盾するので community という語ごと落とした。
          uppercase を外したのは、問いかけを全部大文字にすると英語で叫んで見えるため。 */}
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4 text-center">
        {t('chooseGenre')}
      </p>

      <PortalTenantSearch
        tenants={cards}
        searchPlaceholder={t('searchPlaceholder')}
        noResultsLabel={t('noResults')}
      />

      <div className="mt-16 pt-10 border-t border-gray-100">
        <PortalLanguageSwitcher currentLocale={locale} label={tProfile('languageLabel')} />
      </div>
    </main>
  )
}
