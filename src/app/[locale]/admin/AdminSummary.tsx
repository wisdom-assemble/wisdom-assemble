// 全テナント横断KPIサマリー（サーバーコンポーネント・純表示）。
// データは admin_dashboard_stats() RPC を service_role で呼んだ結果を受け取る。
// デザインはサイト共通トークン（gray系・rounded-lg・border-gray-100）に合わせる。
import { TENANT_NAME_MAP, getPublicSubdomain } from '@/lib/tenantNames'
import AiBudgetEditor from './AiBudgetEditor'

// Groqの利用上限（Spend Limit）設定ページ。有料化後にここで請求の物理的な蓋をかける。
const GROQ_LIMITS_URL = 'https://console.groq.com/settings/billing/limits'

export type DashboardStats = {
  totals: {
    questions: number
    users: number
    answers: number
    ai_answers: number
    human_answers: number
    solved: number
    unsolved: number
    hard: number
    views: number
    tenant_count: number       // 稼働（質問がある）テナント数
    tenant_registered: number  // tenantsテーブルの登録総数（下書き含む）
    routed: number
  }
  per_tenant: Array<{
    tenant_id: string
    questions: number
    solved: number
    hard: number
    unsolved: number
    routed: number
    q_7d: number
    q_30d: number
    views: number
    avg_solve_hours: number | null
    ai_answers: number
    human_answers: number
    answerers: number
    ai_cost_usd: number
  }>
  dau: Array<{ day: string; count: number }>
  mau: Array<{ month: string; count: number }>
  tags: Array<{ tag: string; count: number }>
  ai_today: { calls: number; cost_usd: number; cap: number; cap_enabled: boolean }
  revenue: { total_jpy: number; by_source: Record<string, number> }
}

const TENANT_TARGET = 100 // 目標テナント数
// 人間ルーティング率は「低いほど健全」（AIが大半を解決するのが理想）。
// 逆に高すぎる＝Groq障害やバグで質問が全部人間へ落ちている兆候なので、
// この閾値を超えたときだけ異常としてハイライトする（低い側は正常なので出さない）。
const ROUTING_SUSPICIOUS_HIGH = 80

// JSTの「今日」から遡って直近n日のYYYY-MM-DD文字列配列（古い→新しい）
function lastJstDays(n: number): string[] {
  const days: string[] = []
  const now = Date.now()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })) // YYYY-MM-DD
  }
  return days
}

function tenantLabel(id: string): string {
  return TENANT_NAME_MAP[id] ?? id.toUpperCase()
}

function pct(part: number, whole: number): string {
  if (!whole) return '—'
  return `${Math.round((part / whole) * 100)}%`
}

export default function AdminSummary({
  stats,
  colorMap,
}: {
  stats: DashboardStats
  colorMap: Record<string, string>
}) {
  const t = stats.totals

  const routingRate = t.questions ? Math.round((t.routed / t.questions) * 100) : 0
  const routingAbnormal = t.questions > 0 && routingRate > ROUTING_SUSPICIOUS_HIGH
  const aiPct = stats.ai_today.cap ? Math.round((stats.ai_today.calls / stats.ai_today.cap) * 100) : 0
  // 本日のAI質問数が上限に到達/超過しているか（超過は赤・90%台はamber）
  const aiOver = stats.ai_today.cap > 0 && stats.ai_today.calls >= stats.ai_today.cap

  return (
    <div className="space-y-8">
      {/* 運営ヘルス（テナント進捗・ルーティング率・本日AI） */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">運営ヘルス</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 border border-gray-100 rounded-lg">
            <p className="text-2xl font-bold text-gray-800 leading-none">{t.tenant_count}<span className="text-base text-gray-400"> / {TENANT_TARGET}</span></p>
            <p className="text-xs text-gray-500 mt-1.5">稼働テナント数（質問あり）</p>
            <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gray-700 rounded-full" style={{ width: `${Math.min(100, (t.tenant_count / TENANT_TARGET) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">登録 {t.tenant_registered} 件（うち下書き {Math.max(0, t.tenant_registered - t.tenant_count)} 件）</p>
          </div>
          <div className={`p-4 border rounded-lg ${routingAbnormal ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
            <p className={`text-2xl font-bold leading-none ${routingAbnormal ? 'text-red-700' : 'text-gray-800'}`}>{routingRate}%</p>
            <p className="text-xs text-gray-500 mt-1.5">人間ルーティング率{routingAbnormal ? ' ⚠️ 高すぎ' : ''}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">低いほど健全（AIが大半を解決）。{ROUTING_SUSPICIOUS_HIGH}%超はAI障害/バグ疑い</p>
          </div>
          {stats.ai_today.cap_enabled ? (
            <div className={`p-4 border rounded-lg ${aiOver ? 'border-red-300 bg-red-50' : aiPct >= 90 ? 'border-amber-300 bg-amber-50' : 'border-gray-100'}`}>
              <p className={`text-2xl font-bold leading-none ${aiOver ? 'text-red-700' : aiPct >= 90 ? 'text-amber-700' : 'text-gray-800'}`}>{stats.ai_today.calls}<span className="text-base text-gray-400"> / {stats.ai_today.cap}</span></p>
              <p className="text-xs text-gray-500 mt-1.5">本日のAI質問数 / 上限{aiOver ? '（到達）' : ''}（推定 {`$${stats.ai_today.cost_usd.toFixed(3)}`}）</p>
              <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${aiOver ? 'bg-red-500' : aiPct >= 90 ? 'bg-amber-500' : 'bg-gray-700'}`} style={{ width: `${Math.min(100, aiPct)}%` }} />
              </div>
            </div>
          ) : (
            <div className="p-4 border border-gray-100 rounded-lg">
              <p className="text-2xl font-bold text-gray-800 leading-none">{stats.ai_today.calls}<span className="text-base text-gray-400"> 件</span></p>
              <p className="text-xs text-gray-500 mt-1.5">本日のAI質問数（推定 {`$${stats.ai_today.cost_usd.toFixed(3)}`}）</p>
              <p className="text-[10px] text-gray-400 mt-1.5">無料プラン・制限なし（Groqの無料枠で自然に頭打ち）</p>
            </div>
          )}
        </div>
      </section>

      {/* AIコスト上限（三重ストッパー） */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">AIコスト上限（三重ストッパー）</h2>
        <div className="border border-gray-100 rounded-lg p-4 space-y-4">
          {/* 層②: ダッシュボードから変更できる自主上限 */}
          <AiBudgetEditor initialCap={stats.ai_today.cap} initialEnabled={stats.ai_today.cap_enabled} />

          {/* 三層の説明＋Groqリンク（層③） */}
          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-500">
            <p className="font-medium text-gray-600">3つの蓋（①②は挙動制御・③だけが請求を物理的に止める）</p>
            <p>① アプリのレート制限：1人1日3件/テナント・10件/全体（荒らし対策・常時有効）</p>
            <p>② アプリの自主上限：上の設定。<b>無料の今はオフ＝制限なし</b>（Groq無料枠で自然に頭打ち）。有料化したらオンにして上限を設定。</p>
            <p>
              ③ Groq Spend Limit：<b>請求を物理的に止める唯一の蓋</b>。有料化時にGroq側で設定する（¥1,000スタート推奨）。
              <a href={GROQ_LIMITS_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">Groqコンソールで設定 ↗</a>
            </p>
          </div>
        </div>
      </section>

      {/* 全体サマリーカード */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">全体サマリー</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="総質問数" value={t.questions.toLocaleString()} />
          <Stat label="解決率" value={pct(t.solved, t.questions)} sub={`${t.solved} / ${t.questions}`} />
          <Stat label="未解決" value={t.unsolved.toLocaleString()} sub={`うち高難度 ${t.hard}`} />
          <Stat label="総ユーザー数" value={t.users.toLocaleString()} />
          <Stat label="総回答数" value={t.answers.toLocaleString()} />
          <Stat label="AI回答" value={t.ai_answers.toLocaleString()} sub={pct(t.ai_answers, t.answers)} />
          <Stat label="人間回答" value={t.human_answers.toLocaleString()} sub={pct(t.human_answers, t.answers)} />
          <Stat label="総閲覧数" value={t.views.toLocaleString()} />
        </div>
      </section>

      {/* DAU / MAU */}
      <section className="grid md:grid-cols-2 gap-6">
        <DauChart dau={stats.dau} />
        <MauChart mau={stats.mau} />
      </section>

      {/* テナント別サマリー */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">テナント別サマリー</h2>
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <Th className="text-left pl-3">テナント</Th>
                <Th>質問</Th>
                <Th>解決率</Th>
                <Th>ルート率</Th>
                <Th>未解決</Th>
                <Th>高難度</Th>
                <Th>7日</Th>
                <Th>30日</Th>
                <Th>閲覧</Th>
                <Th>AI/人</Th>
                <Th>回答者</Th>
                <Th>平均解決</Th>
                <Th>AI費</Th>
              </tr>
            </thead>
            <tbody>
              {stats.per_tenant.length === 0 && (
                <tr><td colSpan={11} className="text-center text-gray-400 py-8">データなし</td></tr>
              )}
              {stats.per_tenant.map((r) => (
                <tr key={r.tenant_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorMap[r.tenant_id] ?? '#9ca3af' }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{tenantLabel(r.tenant_id)}</p>
                        <p className="text-[10px] text-gray-400 truncate">{getPublicSubdomain(r.tenant_id)}</p>
                      </div>
                    </div>
                  </td>
                  <Td>{r.questions}</Td>
                  <Td>{pct(r.solved, r.questions)}</Td>
                  <RoutingTd routed={r.routed} total={r.questions} />
                  <Td>{r.unsolved}</Td>
                  <Td>{r.hard}</Td>
                  <Td>{r.q_7d}</Td>
                  <Td>{r.q_30d}</Td>
                  <Td>{r.views.toLocaleString()}</Td>
                  <Td>{r.ai_answers}/{r.human_answers}</Td>
                  <Td>{r.answerers}</Td>
                  <Td>{r.avg_solve_hours != null ? `${r.avg_solve_hours}h` : '—'}</Td>
                  <Td>{r.ai_cost_usd > 0 ? `$${r.ai_cost_usd.toFixed(2)}` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* タグ集計（次テナント企画のヒント） */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">人気タグ（AI自動タグ・次テナントのヒント）</h2>
        {stats.tags.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 border border-gray-100 rounded-lg text-center">まだタグ付き質問がありません（新規質問はAIが自動タグ付け）</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.tags.map((tg) => (
              <span key={tg.tag} className="text-xs px-2.5 py-1 border border-gray-200 rounded-full text-gray-600">
                {tg.tag} <span className="text-gray-400">{tg.count}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 収益プレースホルダ（AdSense/Stripe/アフィリ承認後に接続） */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">収益（データ源接続待ち）</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="AdSense" value="—" sub="承認後に接続" />
          <Stat label="Stripeチップ" value="—" sub="実装後に接続" />
          <Stat label="アフィリエイト" value="—" sub="承認後に接続" />
          <Stat label="合計（¥）" value={stats.revenue.total_jpy > 0 ? `¥${stats.revenue.total_jpy.toLocaleString()}` : '—'} sub="daily_revenue" />
        </div>
        <p className="text-[10px] text-gray-400 mt-2">※ 収益データの箱（daily_revenue表）は用意済み。AdSense/Stripe承認後にAPI連携して数字を入れる。黒字額（収益−Groqコスト）もその時に表示。</p>
      </section>
    </div>
  )
}

function RoutingTd({ routed, total }: { routed: number; total: number }) {
  const rate = total ? Math.round(((routed ?? 0) / total) * 100) : 0
  const abnormal = total > 0 && rate > ROUTING_SUSPICIOUS_HIGH
  return (
    <td className={`px-2 py-2.5 text-right tabular-nums whitespace-nowrap ${abnormal ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
      {total ? `${rate}%` : '—'}{abnormal ? ' ⚠️' : ''}
    </td>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`font-medium px-2 py-2 text-right whitespace-nowrap ${className}`}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{children}</td>
}

// 直近30日の投稿者DAUを縦棒で表示（活動のない日は0で埋める）
function DauChart({ dau }: { dau: DashboardStats['dau'] }) {
  const days = lastJstDays(30)
  const map = new Map(dau.map((d) => [d.day, d.count]))
  const series = days.map((day) => ({ day, count: map.get(day) ?? 0 }))
  const max = Math.max(1, ...series.map((s) => s.count))
  const peak = Math.max(0, ...series.map((s) => s.count))
  const todayCount = series[series.length - 1]?.count ?? 0

  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500">DAU（投稿者・直近30日）</h2>
        <span className="text-xs text-gray-400">今日 {todayCount} / 最大 {peak}</span>
      </div>
      <div className="flex items-end gap-[2px] h-24">
        {series.map((s) => (
          <div key={s.day} className="flex-1 flex flex-col justify-end group relative" title={`${s.day}: ${s.count}`}>
            <div
              className="w-full bg-gray-800 rounded-sm min-h-[1px] group-hover:bg-gray-900 transition-colors"
              style={{ height: `${(s.count / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{series[0]?.day.slice(5)}</span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        ※ 質問・回答を投稿したユーザーのみ集計（閲覧のみの訪問者は含まない）
      </p>
    </div>
  )
}

// 直近12ヶ月の投稿者MAUを横棒で表示
function MauChart({ mau }: { mau: DashboardStats['mau'] }) {
  const max = Math.max(1, ...mau.map((m) => m.count))
  const latest = mau[mau.length - 1]?.count ?? 0
  return (
    <div className="p-4 border border-gray-100 rounded-lg">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500">MAU（投稿者・直近12ヶ月）</h2>
        <span className="text-xs text-gray-400">今月 {latest}</span>
      </div>
      {mau.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">データなし</p>
      ) : (
        <div className="space-y-1.5">
          {mau.map((m) => (
            <div key={m.month} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-14 shrink-0 tabular-nums">{m.month}</span>
              <div className="flex-1 bg-gray-100 rounded-sm h-4 overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-sm"
                  style={{ width: `${(m.count / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8 text-right tabular-nums">{m.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
