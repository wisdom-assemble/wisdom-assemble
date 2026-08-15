import { redirect } from 'next/navigation'

// メールでの新規登録は廃止した（Googleログインのみ）。
// Supabase側でもEmailプロバイダを無効化しており、このページのフォームから
// 登録しようとしても Email signups are disabled で失敗する状態だった。
// どこからもリンクされていないが、URLを直接開けば到達できてしまうため、
// 入口ごとログイン画面へ寄せる（2026-08-15）。
export default function SignupPage() {
  redirect('/auth/login')
}
