// 個人連絡先・禁止コンテンツのフィルタリング

const CONTACT_PATTERNS = [
  // メールアドレス
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // 電話番号（コード・日付・IP・バージョン番号の誤検知を避け、電話番号らしい形式のみ）
  //  ・国際番号（+から始まる）
  /\+\d[\d\s.\-()]{7,}\d/,
  //  ・ハイフン/スペース区切りの3グループ（例 090-1234-5678, 03-1234-5678）。
  //    中央グループを3〜4桁必須にしているため ISO日付(2026-07-14=4-2-2) は一致しない。
  //    ドット区切りはIP(255.255.255.0)・バージョン番号と衝突するため対象外。
  /\b\d{2,4}[\s\-]\d{3,4}[\s\-]\d{3,4}\b/,
  //  ・区切りなし11桁（日本の携帯 09012345678。日付は最大8桁、13桁以上のタイムスタンプは境界で不一致）
  /\b\d{11}\b/,
  // LINE ID（"line: 42"等のスタックトレース誤検知を避けるため、
  //  "line id:" 形式 か "line@" 形式で、かつ値に英字を含むもののみ検知）
  /\bline\b\s*(?:id\s*)?[:：@＠]\s*[\w.\-]*[a-zA-Z][\w.\-]*/i,
  // SNSハンドル共有（"@types/node"・"@media"・"@Override"等のコード誤検知を避けるため、
  //  SNS名やDM等の文脈語を伴う @ハンドル のみ検知。裸の @xxx は対象外）
  /(?:insta(?:gram)?|ig|twitter|tiktok|snapchat|dm|連絡先?|フォロー|アカウント)\s*(?:id)?\s*[:：]?\s*[@＠][\w.\-]{2,}/i,
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

// reasonCodeはmessages/*.jsonのapiErrors配下のキー名と対応させ、
// 呼び出し側(APIルート)でロケールに応じたメッセージへ変換する。
export type FilterResult =
  | { ok: true }
  | { ok: false; reasonCode: 'contactInfoNotAllowed' | 'spamNotAllowed' }

export function checkContent(text: string): FilterResult {
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reasonCode: 'contactInfoNotAllowed' }
    }
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reasonCode: 'spamNotAllowed' }
    }
  }
  return { ok: true }
}
