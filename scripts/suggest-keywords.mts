/**
 * ジャンルの「実際に検索されている語」を Google サジェストから収集する調査ツール。
 *
 * 使い方:
 *   npx tsx scripts/suggest-keywords.mts ギター エフェクター 真空管アンプ
 *   npx tsx scripts/suggest-keywords.mts --out guitar ギター エフェクター    (結果をJSONに保存)
 *
 * 何のためのツールか
 * ------------------
 * 新テナントの TENANT_SKILL_OPTIONS / TENANT_SUGGESTED_KEYWORDS を勘で決めると、
 * 「誰も検索しない語」や「別ジャンルに食われる語」が並ぶ。ここで実データを見てから決める。
 *
 * ⚠️ 検索ボリュームの実数（月間何回検索されたか）はこのAPIでは取れない。
 *    実数が要るときは Google キーワードプランナー／ラッコキーワード等を使う。
 *    サジェストは「実際に打たれている語を頻度順に返す候補」なので、順位の相対比較に使う。
 *
 * ⚠️ サイト内検索チップ(TENANT_SUGGESTED_KEYWORDS)に使う語は、
 *    「よく検索される」だけでは足りない。実際にそのテナントの質問本文に
 *    その文字列が出てこないと、押しても0件になる（検索は title/body の部分一致）。
 *    最終確定は質問を投入したあとに verify で行うこと。
 */

const ENDPOINT = 'https://suggestqueries.google.com/complete/search'
const INTERVAL_MS = 400

type SeedResult = { seed: string; suggestions: string[]; error?: string }

async function fetchSuggestions(seed: string): Promise<SeedResult> {
  const url =
    `${ENDPOINT}?client=firefox&hl=ja&ie=utf-8&oe=utf-8&q=${encodeURIComponent(seed)}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return { seed, suggestions: [], error: `HTTP ${res.status}` }
    const json = JSON.parse(await res.text())
    const list: string[] = Array.isArray(json?.[1]) ? json[1] : []
    return { seed, suggestions: list }
  } catch (e) {
    return { seed, suggestions: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** サジェストからシード語を除いた「後続の語」を頻度順に集計する＝そのジャンルの実需。 */
function intentRanking(results: SeedResult[]): { word: string; count: number; seeds: string[] }[] {
  const seeds = new Set(results.map((r) => r.seed))
  const tally = new Map<string, { count: number; seeds: Set<string> }>()

  for (const r of results) {
    for (const s of r.suggestions) {
      // 「ギター 弦高調整」→ シード語を落として「弦高調整」を取り出す
      const rest = s.replace(r.seed, ' ').trim()
      for (const w of rest.split(/[\s　]+/)) {
        if (!w || seeds.has(w) || w.length < 2) continue
        const cur = tally.get(w) ?? { count: 0, seeds: new Set<string>() }
        cur.count++
        cur.seeds.add(r.seed)
        tally.set(w, cur)
      }
    }
  }

  return [...tally.entries()]
    .map(([word, v]) => ({ word, count: v.count, seeds: [...v.seeds] }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
}

/**
 * シード語がそのジャンルの語として通じるかの「目安」。
 *
 * ⚠️ これは判定ではなくヒント。他のシード語がサジェストに出てくれば確実にジャンル文脈だが、
 *    出てこなくても健全なことがある（例: 「弦高」→ 弦高調整／測り方／下げ方＝完全に実需だが、
 *    他のシード語は出てこない）。逆に「ピックアップ」は ガチャ／トラック で本当に食われている。
 *    自動で断定できないので、実際のサジェスト一覧を人が見て決めること。
 */
function ambiguityNote(r: SeedResult, allSeeds: string[]): string {
  if (r.error) return `取得失敗: ${r.error}`
  if (r.suggestions.length === 0) return 'サジェストなし'
  const others = allSeeds.filter((s) => s !== r.seed)
  const hit = r.suggestions.some((s) => others.some((o) => s.includes(o)))
  return hit ? 'ジャンル文脈が確認できた' : '要目視（下の候補で判断）'
}

async function main() {
  const argv = process.argv.slice(2)
  let outName = ''
  const seeds: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') { outName = argv[++i] ?? ''; continue }
    seeds.push(argv[i])
  }

  if (seeds.length === 0) {
    console.error('使い方: npx tsx scripts/suggest-keywords.mts [--out <名前>] <シード語> [シード語...]')
    console.error('例:     npx tsx scripts/suggest-keywords.mts --out guitar ギター エフェクター 真空管アンプ')
    process.exit(1)
  }

  const results: SeedResult[] = []
  for (const seed of seeds) {
    const r = await fetchSuggestions(seed)
    results.push(r)
    console.log(`\n### ${seed}   [${ambiguityNote(r, seeds)}]`)
    if (r.error) console.log(`  (取得失敗: ${r.error})`)
    for (const s of r.suggestions) console.log(`  ${s}`)
    await new Promise((res) => setTimeout(res, INTERVAL_MS))
  }

  const ranking = intentRanking(results)
  console.log('\n\n=== 実需ランキング（サジェストに繰り返し出る語＝そのジャンルの悩み） ===')
  for (const { word, count, seeds: from } of ranking.slice(0, 30)) {
    console.log(`  ${String(count).padStart(2)}回  ${word}   ← ${from.join(', ')}`)
  }

  console.log('\n=== シード語ごとのまとめ（採否はここを見て人が決める） ===')
  for (const r of results) {
    const top = r.suggestions.filter((s) => s !== r.seed).slice(0, 3).join(' / ')
    console.log(`  ${r.seed.padEnd(12, '　')} ${ambiguityNote(r, seeds)}`)
    console.log(`  ${''.padEnd(12, '　')} 上位: ${top || '(なし)'}`)
  }

  if (outName) {
    const path = `scripts/suggest.${outName}.json`
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path, JSON.stringify({ seeds, results, ranking }, null, 2), 'utf-8')
    console.log(`\n保存: ${path}`)
  }

  console.log(
    '\n⚠️ ここで出るのは「検索されている語」まで。サイト内検索チップは、質問本文に' +
    'その文字列が実際に出てくるかを投稿後に確認して確定すること。'
  )
}

main()
