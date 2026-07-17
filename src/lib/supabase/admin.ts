import { createClient } from '@supabase/supabase-js'

// service_role キー（RLSをバイパス）を使う管理者クライアント。
// サーバーサイドのAPI route内でのみ使用すること。
// service_role キーは絶対にクライアントへ露出させない。
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
