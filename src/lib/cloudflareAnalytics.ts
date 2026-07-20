// Cloudflare Web Analytics（RUM）の訪問者データを GraphQL Analytics API から取得する。
// 認証は Worker Secret の CF_ANALYTICS_API_TOKEN（read-only）＋ CF_ACCOUNT_ID。
// サーバー側専用（トークンはクライアントに絶対出さない）。/admin の「訪問者」タブで使用。
//
// 注: このアカウントには Web Analytics サイトが1つ（wisdomassemble.com・全サブドメインを含む）
// しかないため、siteTag フィルタは省略しても当該サイトのデータが返る。将来複数サイトに
// なったら requestHost で絞る or siteTag を指定すること。

const CF_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql'

export type VisitorStats = {
  configured: boolean
  error?: string
  rangeDays: number
  totals: { pageviews: number; visits: number; pageviews7d: number; visits7d: number }
  byDay: Array<{ date: string; pageviews: number; visits: number }>
  referrers: Array<{ host: string; pageviews: number }>
  // テナント別（=requestHost別）の流入元（refererHost）クロス集計
  refByTenant: Array<{ host: string; referer: string; pageviews: number }>
  pages: Array<{ host: string; path: string; pageviews: number }>
  hosts: Array<{ host: string; pageviews: number; visits: number }>
  countries: Array<{ country: string; pageviews: number }>
}

function emptyStats(days: number, extra?: Partial<VisitorStats>): VisitorStats {
  return {
    configured: false,
    rangeDays: days,
    totals: { pageviews: 0, visits: 0, pageviews7d: 0, visits7d: 0 },
    byDay: [],
    referrers: [],
    refByTenant: [],
    pages: [],
    hosts: [],
    countries: [],
    ...extra,
  }
}

type Group = {
  count: number
  sum?: { visits: number }
  dimensions: {
    date?: string
    refererHost?: string
    requestHost?: string
    requestPath?: string
    countryName?: string
  }
}

export async function getVisitorStats(days = 30): Promise<VisitorStats> {
  const token = process.env.CF_ANALYTICS_API_TOKEN
  const account = process.env.CF_ACCOUNT_ID
  if (!token || !account) return emptyStats(days)

  // 日付は文字列としてクエリに直接埋め込む（ユーザー入力ではなく計算値なので安全）。
  // Time スカラの変数型宣言を避けるためインライン化する。
  const untilIso = new Date().toISOString()
  const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString()
  const dateFilter = `datetime_geq: "${sinceIso}", datetime_leq: "${untilIso}"`

  const query = `
    query ($account: String!) {
      viewer {
        accounts(filter: { accountTag: $account }) {
          byDay: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 1000, orderBy: [date_ASC]
          ) { count sum { visits } dimensions { date } }
          byReferer: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 15, orderBy: [count_DESC]
          ) { count dimensions { refererHost } }
          byHostReferer: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 100, orderBy: [count_DESC]
          ) { count dimensions { requestHost refererHost } }
          byPath: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 15, orderBy: [count_DESC]
          ) { count dimensions { requestHost requestPath } }
          byHost: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 25, orderBy: [count_DESC]
          ) { count sum { visits } dimensions { requestHost } }
          byCountry: rumPageloadEventsAdaptiveGroups(
            filter: { ${dateFilter} }, limit: 12, orderBy: [count_DESC]
          ) { count dimensions { countryName } }
        }
      }
    }`

  let json: {
    data?: { viewer?: { accounts?: Array<Record<string, Group[]>> } }
    errors?: Array<{ message?: string }>
  }
  try {
    const res = await fetch(CF_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { account } }),
      // 5分キャッシュ（訪問者タブを開くたびに叩かない）
      next: { revalidate: 300 },
    })
    json = await res.json()
  } catch (e) {
    return emptyStats(days, { configured: true, error: `fetch failed: ${String(e).slice(0, 200)}` })
  }

  if (json.errors?.length) {
    return emptyStats(days, {
      configured: true,
      error: json.errors.map((e) => e.message).filter(Boolean).join('; ').slice(0, 300) || 'GraphQL error',
    })
  }

  const acc = json.data?.viewer?.accounts?.[0]
  if (!acc) {
    return emptyStats(days, { configured: true, error: 'アカウントデータが取得できませんでした（権限/アカウントIDを確認）' })
  }

  const byDayRaw = acc.byDay ?? []
  const byDay = byDayRaw.map((g) => ({
    date: g.dimensions.date ?? '',
    pageviews: g.count ?? 0,
    visits: g.sum?.visits ?? 0,
  }))

  const pageviews = byDay.reduce((s, d) => s + d.pageviews, 0)
  const visits = byDay.reduce((s, d) => s + d.visits, 0)
  // 直近7日は日別系列の末尾7件を合算
  const last7 = byDay.slice(-7)
  const pageviews7d = last7.reduce((s, d) => s + d.pageviews, 0)
  const visits7d = last7.reduce((s, d) => s + d.visits, 0)

  const referrers = (acc.byReferer ?? []).map((g) => ({
    host: g.dimensions.refererHost || '(direct / なし)',
    pageviews: g.count ?? 0,
  }))
  const refByTenant = (acc.byHostReferer ?? []).map((g) => ({
    host: g.dimensions.requestHost ?? '',
    referer: g.dimensions.refererHost || '(direct / なし)',
    pageviews: g.count ?? 0,
  }))
  const pages = (acc.byPath ?? []).map((g) => ({
    host: g.dimensions.requestHost ?? '',
    path: g.dimensions.requestPath ?? '',
    pageviews: g.count ?? 0,
  }))
  const hosts = (acc.byHost ?? []).map((g) => ({
    host: g.dimensions.requestHost ?? '',
    pageviews: g.count ?? 0,
    visits: g.sum?.visits ?? 0,
  }))
  const countries = (acc.byCountry ?? []).map((g) => ({
    country: g.dimensions.countryName || '(unknown)',
    pageviews: g.count ?? 0,
  }))

  return {
    configured: true,
    rangeDays: days,
    totals: { pageviews, visits, pageviews7d, visits7d },
    byDay,
    referrers,
    refByTenant,
    pages,
    hosts,
    countries,
  }
}
