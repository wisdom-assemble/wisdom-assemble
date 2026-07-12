// 個人連絡先・禁止コンテンツのフィルタリング

const CONTACT_PATTERNS = [
  // メールアドレス
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // 電話番号（日本・国際）
  /(\+?[\d\-\.\(\)\s]{10,15})/,
  // LINE ID（"Linear"等、lineを含む単語との誤マッチを避けるため単語境界必須。
  // 記号(:／＠)を伴わない裸の"line"はDAW用語(offline, timeline等)と衝突しやすいため対象外）
  /\bline\b\s*(\bid\b\s*)?[:：@＠]\s*[\w\-.]+/i,
  /[@＠][\w\-.]{3,}/,
  // WhatsApp
  /whatsapp\s*([:：]|id\s*[:：]?)\s*[\d\+\s\-]+/i,
  // Telegram
  /telegram\s*([:：]|id\s*[:：]?|@)\s*[\w\-]+/i,
  /t\.me\/[\w\-]+/i,
  // Instagram / Twitter / X
  /instagram\.com\/[\w.\-]+/i,
  /twitter\.com\/[\w.\-]+/i,
  /x\.com\/[\w.\-]+/i,
  // Discord
  /discord(\.gg\/[\w\-]+|[\s:][\w#]+#\d{4})/i,
  // Skype
  /skype\s*([:：]|id\s*[:：]?)\s*[\w.\-]+/i,
  // WeChat / 微信
  /(wechat|weixin|微信)\s*([:：]|id\s*[:：]?)\s*[\w.\-]+/i,
  // Zoom
  /zoom\.us\/j\/\d+/i,
  // 外部URL全般（連絡誘導目的）※自サイト（サブドメイン含む）は除外
  /https?:\/\/(?!([\w-]+\.)?wisdomassemble\.com)[^\s]+/i,
]

const SPAM_PATTERNS = [
  // 業者・勧誘ワード（日本語）
  /副業|お小遣い|稼げる|在宅ワーク|高収入|ノルマなし|初心者歓迎.*稼|紹介料|報酬あり/,
  // 英語スパム
  /earn\s+\$[\d,]+/i,
  /work\s+from\s+home.*earn/i,
  /click\s+here\s+to\s+earn/i,
  /free\s+money/i,
  /investment\s+opportunity/i,
]

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string }

export function checkContent(text: string): FilterResult {
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: '個人の連絡先情報（メールアドレス・電話番号・SNSアカウント等）は投稿できません。',
      }
    }
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: '広告・勧誘目的の投稿はできません。',
      }
    }
  }
  return { ok: true }
}
