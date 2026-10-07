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

/* 【2026-10-07】カードに載せる「回答例」。AdSense 1回目の不承認（10/5・有用性の低いコンテンツ）を受けて追加。
   審査対象はルートドメインだけなのに、ルートには質問が1つも見えていなかった（本文約300字）。
   各ジャンルの実際のQ&Aを「AIが答えた例」「人間が答えた例」の1つずつ見せ、
   コピー「AIに聞く。AIがわからなければ、人間が答える。」をカードの中身で示す。 */
export type PortalExample = {
  kind: 'ai' | 'human'
  href: string
  title: string
  excerpt: string
  answererName: string | null
}

// 抜粋の長さ。表示は line-clamp-3 で切るので、どの言語でも3行が埋まる程度に。
// 日中韓は1文字の情報量が多いので短く、英語などは同じ3行に倍近い文字数が入る。
const EXAMPLE_EXCERPT_CHARS_CJK = 120
const EXAMPLE_EXCERPT_CHARS_OTHER = 220
// 人間の回答例はこの文字数以上のものを優先する（一言回答をショーケースにしない）
const HUMAN_EXAMPLE_MIN_CHARS = 120

// 回答本文（Markdownを含みうる）をカード用の地の文にする
function toExcerpt(text: string, locale: string): string {
  const limit = ['ja', 'zh', 'ko'].includes(locale) ? EXAMPLE_EXCERPT_CHARS_CJK : EXAMPLE_EXCERPT_CHARS_OTHER
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~|]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > limit ? `${plain.slice(0, limit)}…` : plain
}

type Admin = ReturnType<typeof getAdminClient>

async function fetchExamples(admin: Admin, tenantId: string, locale: string): Promise<PortalExample[]> {
  const base = `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com/${locale}/questions/`
  const examples: PortalExample[] = []

  // AIが答えた例：AI回答済みの最新の質問と、そのAI回答
  const { data: aiQuestion } = await admin
    .from('questions')
    .select('id, slug, title, title_i18n')
    .eq('tenant_id', tenantId)
    .eq('status', 'ai_answered')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (aiQuestion) {
    const { data: aiAnswer } = await admin
      .from('answers')
      .select('body, body_i18n')
      .eq('question_id', aiQuestion.id)
      .eq('is_ai', true)
      .limit(1)
      .maybeSingle()
    if (aiAnswer) {
      examples.push({
        kind: 'ai',
        href: base + aiQuestion.slug,
        title: (aiQuestion.title_i18n as Record<string, string> | null)?.[locale] ?? aiQuestion.title,
        excerpt: toExcerpt((aiAnswer.body_i18n as Record<string, string> | null)?.[locale] ?? aiAnswer.body, locale),
        answererName: null,
      })
    }
  }

  // 人間が答えた例：ベストアンサーに選ばれた人間の回答（新しい順・短すぎるものは後回し）
  const { data: acceptedRows } = await admin
    .from('answers')
    .select('question_id, user_id, body, body_i18n')
    .eq('tenant_id', tenantId)
    .eq('is_ai', false)
    .eq('is_accepted', true)
    .order('created_at', { ascending: false })
    .limit(10)
  const accepted = acceptedRows ?? []
  const picked = accepted.find((a) => (a.body ?? '').length >= HUMAN_EXAMPLE_MIN_CHARS) ?? accepted[0]
  if (picked) {
    const [{ data: humanQuestion }, { data: tenantProfile }, { data: profile }] = await Promise.all([
      admin.from('questions').select('slug, title, title_i18n').eq('id', picked.question_id).maybeSingle(),
      admin.from('tenant_profiles').select('display_name').eq('tenant_id', tenantId).eq('user_id', picked.user_id).maybeSingle(),
      admin.from('profiles').select('username').eq('id', picked.user_id).maybeSingle(),
    ])
    if (humanQuestion) {
      examples.push({
        kind: 'human',
        href: base + humanQuestion.slug,
        title: (humanQuestion.title_i18n as Record<string, string> | null)?.[locale] ?? humanQuestion.title,
        excerpt: toExcerpt((picked.body_i18n as Record<string, string> | null)?.[locale] ?? picked.body, locale),
        answererName: tenantProfile?.display_name ?? profile?.username ?? null,
      })
    }
  }

  return examples
}

/* 【2026-10-07】回答例の下に並べる「ほかの質問」のタイトル（6つ・回答例と重複しないもの）。
   ルートから各ジャンルの質問ページへ直接たどれる入口を増やす（審査はルートから入るため）。
   並びは「人間の回答が新しく付いた順」。回答が付くたびにルートの顔ぶれが入れ替わり、
   サイトが動いていることがルートから見える（AdSenseの確認点「継続的な更新」）。足りなければ新しい質問で埋める。 */
export type PortalQuestionLink = { href: string; title: string }
const MORE_QUESTIONS_COUNT = 6

async function fetchMoreQuestions(admin: Admin, tenantId: string, locale: string, excludeHrefs: string[]): Promise<PortalQuestionLink[]> {
  const base = `https://${getPublicSubdomain(tenantId)}.wisdomassemble.com/${locale}/questions/`
  const toLink = (q: { slug: string; title: string; title_i18n: unknown }) => ({
    href: base + q.slug,
    title: (q.title_i18n as Record<string, string> | null)?.[locale] ?? q.title,
  })

  const { data: recentAnswers } = await admin
    .from('answers')
    .select('question_id')
    .eq('tenant_id', tenantId)
    .eq('is_ai', false)
    .order('created_at', { ascending: false })
    .limit(40)
  const answeredIds = [...new Set((recentAnswers ?? []).map((a) => a.question_id as string))]

  const [{ data: answeredRows }, { data: newestRows }] = await Promise.all([
    answeredIds.length > 0
      ? admin.from('questions').select('id, slug, title, title_i18n').in('id', answeredIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; title_i18n: unknown }[] }),
    admin
      .from('questions')
      .select('id, slug, title, title_i18n')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(MORE_QUESTIONS_COUNT + 2),
  ])
  // .in() は順序を保たないので、回答が新しい順に並べ直す
  const answeredById = new Map((answeredRows ?? []).map((q) => [q.id, q]))
  const ordered = [
    ...answeredIds.map((id) => answeredById.get(id)).filter((q): q is NonNullable<typeof q> => !!q),
    ...(newestRows ?? []),
  ]

  const links: PortalQuestionLink[] = []
  for (const q of ordered) {
    const link = toLink(q)
    if (excludeHrefs.includes(link.href) || links.some((l) => l.href === link.href)) continue
    links.push(link)
    if (links.length >= MORE_QUESTIONS_COUNT) break
  }
  return links
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
  // 回答例・しくみの文言は既存の8言語訳を流用する（新しいコピーを書かない＝ブランド表記の統一ルール）
  const tQuestion = await getTranslations('questionPage')
  const tHow = await getTranslations('howItWorksPage')

  const admin = getAdminClient()
  // page.tsxのタグライン取得と同じ .eq(...).single() の形に揃える
  // （.in()での一括取得だと本番で稀に color_theme が取得できないことがあったため）
  const [results, examplesByTenant] = await Promise.all([
    Promise.all(
      REVIEW_TENANT_IDS.map((tenantId) =>
        admin.from('tenants').select('*').eq('id', tenantId).single()
      )
    ),
    // 回答例の取得に失敗してもポータル自体は出す（カードが回答例なしになるだけ）
    Promise.all(
      REVIEW_TENANT_IDS.map(async (tenantId) => {
        try {
          const examples = await fetchExamples(admin, tenantId, locale)
          const more = await fetchMoreQuestions(admin, tenantId, locale, examples.map((e) => e.href))
          return { examples, more }
        } catch (e) {
          console.error(`[PortalHome] examples fetch failed for ${tenantId}:`, e)
          return { examples: [] as PortalExample[], more: [] as PortalQuestionLink[] }
        }
      })
    ),
  ])

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
      examples: examplesByTenant[i].examples,
      moreQuestions: examplesByTenant[i].more,
    }
  })

  // ルートでは質問を投稿できないので、最初の手順は「ジャンルを選ぶ」（2026-10-07 mtさん指摘）。
  // 2つ目以降は使い方ページの手順名をそのまま流用
  const howSteps = [t('stepChooseGenre'), tHow('step1Title'), tHow('step2Title'), tHow('step3Title')]

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

      {/* 【2026-10-07】しくみ4ステップ。コピー「AIに聞く。AIがわからなければ、人間が答える。」の中身を手順で見せる */}
      <section aria-label={tHow('title')} className="mb-8 sm:mb-10">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {howSteps.map((step, i) => (
            <li key={i} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-xs text-gray-700 leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      </section>

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
        labels={{
          aiAnswered: tQuestion('statusAiAnswered'),
          bestAnswer: tQuestion('bestAnswer'),
          seeAll: tHow('listButton'),
        }}
      />

      <div className="mt-16 pt-10 border-t border-gray-100">
        <PortalLanguageSwitcher currentLocale={locale} label={tProfile('languageLabel')} />
      </div>
    </main>
  )
}
