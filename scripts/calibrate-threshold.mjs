// ⚠️ このファイルは廃止されました（2026-07-22）。
// プロンプト・adjustScore・モデルを自前コピーしていたため本番(src/lib/gemini.ts)と
// 必ずズレ、実際に較正結果が食い違いました（長文減点500字 vs 1200字など）。
// 本番コードをimportする後継を使ってください:
//     npx tsx scripts/calibrate-threshold.mts <config.json>
console.error('[廃止] scripts/calibrate-threshold.mjs は本番とズレるため廃止しました。')
console.error('       代わりに: npx tsx scripts/calibrate-threshold.mts <config.json>')
process.exit(1)
