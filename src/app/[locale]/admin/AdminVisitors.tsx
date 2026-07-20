// 訪問者KPI表示（Cloudflare Web Analytics由来・サーバーコンポーネント・純表示）。
// 投稿者ベース(DB)のサマリータブと対になる「実際にサイトを訪れた人」の指標。
import type { VisitorStats } from '@/lib/cloudflareAnalytics'
import { TENANT_NAME_MAP } from '@/lib/tenantNames'

// 公開ホスト名 → 内部テナントキーに正規化する。
// CFはホスト名ごとに集計するため、同じテナントに複数ホストが向いていると重複して見える
// （例: 旧 debug.wisdomassemble.com は現 bug.wisdomassemble.com へ301。dtm↔music-prod も同様）。
// ここで正規化して合算し、テナント単位で1行にまとめる。
function tenantKeyOf(host: string): string {
  if (!host) return 'unknown'
  if (host === 'wisdomassemble.com' || host === 'www.wisdomassemble.com') return 'root'
  const sub = host.replace(/\.wisdomassemble\.com$/, '')
  const alias: Record<string, string> = { debug: 'bug', bug: 'bug', dtm: 'music-prod', 'music-prod': 'music-prod' }
  return alias[sub] ?? sub
}

function labelForKey(key: string): string {
  if (key === 'root') return 'ルートポータル'
  if (key === 'unknown') return '(unknown)'
  const map: Record<string, string> = { bug: 'BUG DEBUG', 'music-prod': 'MUSIC PRODUCTION' }
  return map[key] ?? TENANT_NAME_MAP[key] ?? key
}

// テナントキーの代表（公開）ホスト名
function publicHostForKey(key: string): string {
  if (key === 'root') return 'wisdomassemble.com'
  if (key === 'unknown') return ''
  return `${key}.wisdomassemble.com`
}

// 表示順は「実装順」（先に立ち上げた順）。未知テナントは後ろでPV降順。
const TENANT_ORDER = ['bug', 'music-prod', 'root']
function orderRank(key: string): number {
  const i = TENANT_ORDER.indexOf(key)
  return i === -1 ? TENANT_ORDER.length : i
}

// リファラーのうち自サイトの各サブドメインは公開ホストに正規化（debug.→bug. 等）。
// 外部（google/reddit等）や (direct) はそのまま。
function normalizeReferer(ref: string): string {
  if (!ref || ref === '(direct / なし)') return ref
  if (ref === 'wisdomassemble.com' || ref === 'www.wisdomassemble.com' || ref.endsWith('.wisdomassemble.com')) {
    return publicHostForKey(tenantKeyOf(ref))
  }
  return ref
}

// [{host, pageviews}] を正規化キーで合算し PV 降順の {referer, pageviews}[] にする
function mergeReferers(rows: Array<{ referer: string; pageviews: number }>): Array<{ referer: string; pageviews: number }> {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = normalizeReferer(r.referer)
    m.set(k, (m.get(k) ?? 0) + r.pageviews)
  }
  return [...m.entries()].map(([referer, pageviews]) => ({ referer, pageviews })).sort((a, b) => b.pageviews - a.pageviews)
}

export default function AdminVisitors({ stats }: { stats: VisitorStats }) {
  if (!stats.configured) {
    return (
      <div className="p-6 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-800">
        <p className="font-semibold mb-1">訪問者データ未設定</p>
        <p>Worker Secret に <code className="bg-amber-100 px-1 rounded">CF_ANALYTICS_API_TOKEN</code> と <code className="bg-amber-100 px-1 rounded">CF_ACCOUNT_ID</code> を登録してください。</p>
      </div>
    )
  }

  const t = stats.totals

  // テナント別（ホスト別）訪問：正規化キーで合算し実装順に並べる（debug.↔bug. 等の重複解消）
  const mergedHostsMap = new Map<string, { pv: number; visits: number }>()
  for (const h of stats.hosts) {
    const k = tenantKeyOf(h.host)
    const cur = mergedHostsMap.get(k) ?? { pv: 0, visits: 0 }
    cur.pv += h.pageviews
    cur.visits += h.visits
    mergedHostsMap.set(k, cur)
  }
  const mergedHosts = [...mergedHostsMap.entries()]
    .map(([key, v]) => ({ key, pv: v.pv, visits: v.visits }))
    .sort((a, b) => orderRank(a.key) - orderRank(b.key) || b.pv - a.pv)

  // 人気ページ：同じパスが複数ホストに散らないよう (テナント, パス) で合算
  const pagesMap = new Map<string, { key: string; path: string; pv: number }>()
  for (const p of stats.pages) {
    const k = tenantKeyOf(p.host)
    const mk = `${k}\n${p.path}`
    const cur = pagesMap.get(mk) ?? { key: k, path: p.path, pv: 0 }
    cur.pv += p.pageviews
    pagesMap.set(mk, cur)
  }
  const mergedPages = [...pagesMap.values()].sort((a, b) => b.pv - a.pv).slice(0, 15)

  const mergedReferrers = mergeReferers(stats.referrers.map((r) => ({ referer: r.host, pageviews: r.pageviews })))

  return (
    <div className="space-y-8">
      {stats.error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-xs text-red-700">
          <p className="font-semibold mb-1">Cloudflare API エラー</p>
          <p className="font-mono break-all">{stats.error}</p>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">訪問者サマリー（直近{stats.rangeDays}日）</h2>
          <span className="text-[10px] text-gray-400">source: Cloudflare Web Analytics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={`ページビュー（${stats.rangeDays}日）`} value={t.pageviews.toLocaleString()} />
          <Stat label={`訪問数（${stats.rangeDays}日）`} value={t.visits.toLocaleString()} />
          <Stat label="ページビュー（7日）" value={t.pageviews7d.toLocaleString()} />
          <Stat label="訪問数（7日）" value={t.visits7d.toLocaleString()} />
        </div>
      </section>

      {/* 日別ページビュー */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">日別ページビュー（直近{stats.rangeDays}日）</h2>
        <DayBars byDay={stats.byDay} />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        {/* テナント別（ホスト別） */}
        <RankTable
          title="テナント別（ホスト別）訪問"
          rows={mergedHosts.map((h) => ({
            label: labelForKey(h.key),
            sub: publicHostForKey(h.key),
            value: h.pv,
            value2: h.visits,
          }))}
          valueHead="PV"
          value2Head="訪問"
          emptyLabel="データなし"
        />
        {/* 流入元 */}
        <RankTable
          title="流入元（リファラー）"
          rows={mergedReferrers.map((r) => ({ label: r.referer, value: r.pageviews }))}
          valueHead="PV"
          emptyLabel="データなし"
        />
      </section>

      {/* テナント別の流入元（requestHost × refererHost） */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">テナント別の流入元</h2>
          <span className="text-[10px] text-gray-400">どの流入元がどのテナントへ / PV</span>
        </div>
        <RefByTenant rows={stats.refByTenant} />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        {/* 人気ページ */}
        <RankTable
          title="人気ページ"
          rows={mergedPages.map((p) => ({
            label: p.path || '/',
            sub: labelForKey(p.key),
            value: p.pv,
          }))}
          valueHead="PV"
          emptyLabel="データなし"
        />
        {/* 国 */}
        <RankTable
          title="国・地域"
          rows={stats.countries.map((c) => ({ label: c.country, value: c.pageviews }))}
          valueHead="PV"
          emptyLabel="データなし"
        />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
    </div>
  )
}

function DayBars({ byDay }: { byDay: VisitorStats['byDay'] }) {
  if (byDay.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center border border-gray-100 rounded-lg">データなし</p>
  }
  const max = Math.max(1, ...byDay.map((d) => d.pageviews))
  const peak = Math.max(0, ...byDay.map((d) => d.pageviews))
  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <div className="flex justify-end mb-2">
        <span className="text-xs text-gray-400">最大 {peak.toLocaleString()} PV/日</span>
      </div>
      <div className="flex items-end gap-[2px] h-28">
        {byDay.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end group" title={`${d.date}: ${d.pageviews} PV / ${d.visits} 訪問`}>
            <div
              className="w-full bg-gray-800 rounded-sm min-h-[1px] group-hover:bg-gray-900 transition-colors"
              style={{ height: `${(d.pageviews / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{byDay[0]?.date.slice(5)}</span>
        <span>{byDay[byDay.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

// テナント（正規化キー）ごとに流入元を束ねて表示する。debug.↔bug. 等は1テナントに合算。
function RefByTenant({ rows }: { rows: VisitorStats['refByTenant'] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center border border-gray-100 rounded-lg">データなし</p>
  }
  // key -> (正規化リファラー -> PV)
  const byTenant = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const k = tenantKeyOf(r.host)
    const inner = byTenant.get(k) ?? new Map<string, number>()
    const ref = normalizeReferer(r.referer)
    inner.set(ref, (inner.get(ref) ?? 0) + r.pageviews)
    byTenant.set(k, inner)
  }
  const groups = [...byTenant.entries()]
    .map(([key, inner]) => {
      const refs = [...inner.entries()].map(([referer, pageviews]) => ({ referer, pageviews }))
      return {
        key,
        total: refs.reduce((s, x) => s + x.pageviews, 0),
        refs: refs.sort((a, b) => b.pageviews - a.pageviews).slice(0, 8),
      }
    })
    .sort((a, b) => orderRank(a.key) - orderRank(b.key) || b.total - a.total)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {groups.map((g) => {
        const max = Math.max(1, ...g.refs.map((r) => r.pageviews))
        return (
          <div key={g.key} className="p-4 border border-gray-100 rounded-lg">
            <div className="flex items-baseline justify-between mb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-700 truncate">{labelForKey(g.key)}</h3>
                <span className="text-[10px] text-gray-400 truncate">{publicHostForKey(g.key)}</span>
              </div>
              <span className="text-xs text-gray-500 tabular-nums shrink-0">計 {g.total.toLocaleString()} PV</span>
            </div>
            <div className="space-y-1.5">
              {g.refs.map((r, i) => (
                <div key={`${r.referer}-${i}`} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-700 truncate block">{r.referer}</span>
                    <div className="mt-0.5 bg-gray-100 rounded-sm h-1.5 overflow-hidden">
                      <div className="h-full bg-gray-700 rounded-sm" style={{ width: `${(r.pageviews / max) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 tabular-nums shrink-0 w-12 text-right">
                    {r.pageviews.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Row = { label: string; sub?: string; value: number; value2?: number }

function RankTable({
  title,
  rows,
  valueHead,
  value2Head,
  emptyLabel,
}: {
  title: string
  rows: Row[]
  valueHead: string
  value2Head?: string
  emptyLabel: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500">{title}</h2>
        <span className="text-[10px] text-gray-400">
          {valueHead}{value2Head ? ` / ${value2Head}` : ''}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={`${r.label}-${i}`} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-700 truncate">{r.label}</span>
                  {r.sub && <span className="text-[10px] text-gray-400 truncate shrink-0">{r.sub}</span>}
                </div>
                <div className="mt-0.5 bg-gray-100 rounded-sm h-1.5 overflow-hidden">
                  <div className="h-full bg-gray-700 rounded-sm" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-600 tabular-nums shrink-0 w-16 text-right">
                {r.value.toLocaleString()}
                {r.value2 != null && <span className="text-gray-400"> / {r.value2.toLocaleString()}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
