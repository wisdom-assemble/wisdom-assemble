import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'wisdomassemble@gmail.com'

// AIの自主上限（層②）をダッシュボードから更新する。管理者のみ。
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cap, enabled } = await req.json()
  const capNum = Math.max(1, Math.floor(Number(cap)) || 60)
  const enabledBool = Boolean(enabled)

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin.rpc('set_ai_budget', { p_cap: capNum, p_enabled: enabledBool })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const d = (data ?? {}) as { cap?: number; enabled?: boolean }
  return NextResponse.json({ cap: d.cap ?? capNum, enabled: d.enabled ?? enabledBool })
}
