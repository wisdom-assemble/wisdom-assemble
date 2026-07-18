// 訪問者KPI表示（Cloudflare Web Analytics由来・サーバーコンポーネント・純表示）。
// 投稿者ベース(DB)のサマリータブと対になる「実際にサイトを訪れた人」の指標。
import type { VisitorStats } from '@/lib/cloudflareAnalytics'
import { TENANT_NAME_MAP } from '@/lib/tenantNames'

// 公開ホスト名 → テナント表示名
function hostLabel(host: string): string {
  if (!host) return '(unknown)'
  if (host === 'wisdomassemble.com' || host === 'www.wisdomassemble.com') return 'ルートポータル'
  const sub = host.replace(/\.wisdomassemble\.com$/, '')
  const map: Record<string, string> = { bug: 'BUG DEBUG', 'music-prod': 'MUSIC PRODUCTION' }
  return map[sub] ?? TENANT_NAME_MAP[sub] ?? host
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
          rows={stats.hosts.map((h) => ({
            label: hostLabel(h.host),
            sub: h.host,
            value: h.pageviews,
            value2: h.visits,
          }))}
          valueHead="PV"
          value2Head="訪問"
          emptyLabel="データなし"
        />
        {/* 流入元 */}
        <RankTable
          title="流入元（リファラー）"
          rows={stats.referrers.map((r) => ({ label: r.host, value: r.pageviews }))}
          valueHead="PV"
          emptyLabel="データなし"
        />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        {/* 人気ページ */}
        <RankTable
          title="人気ページ"
          rows={stats.pages.map((p) => ({
            label: p.path || '/',
            sub: hostLabel(p.host),
            value: p.pageviews,
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
