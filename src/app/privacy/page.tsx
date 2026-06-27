import Header from '@/components/Header'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 w-full">
        <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
        <p className="text-xs text-gray-400 mb-8">最終更新：2026年6月28日</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          <Section title="1. 取得する情報">
            <p>本サービスでは、以下の情報を取得します。</p>
            <ul>
              <li>Googleアカウントから提供されるメールアドレス・表示名・プロフィール画像URL</li>
              <li>投稿した質問・回答の内容</li>
              <li>プロフィールに設定したスキルタグ・表示名・稼働状態</li>
              <li>アクセスログ（IPアドレス・閲覧ページ）</li>
            </ul>
          </Section>

          <Section title="2. 情報の利用目的">
            <ul>
              <li>サービスの提供・改善</li>
              <li>質問と回答者のマッチング処理</li>
              <li>不正利用の防止</li>
              <li>サービスに関するお知らせ</li>
            </ul>
          </Section>

          <Section title="3. 第三者への提供">
            <p>
              法令に基づく場合を除き、取得した個人情報を第三者に提供することはありません。
              ただし、以下のサービスを利用しており、各社のプライバシーポリシーが適用されます。
            </p>
            <ul>
              <li>Supabase（データベース・認証）</li>
              <li>Groq（AI回答生成 ※質問内容が処理に利用されます）</li>
              <li>Google（OAuth認証）</li>
            </ul>
          </Section>

          <Section title="4. データの保管・削除">
            <p>
              取得したデータはSupabaseのデータベースに保管されます。
              アカウント削除をご希望の場合は、お問い合わせフォームよりご連絡ください。
              確認後、速やかに対応いたします。
            </p>
          </Section>

          <Section title="5. Cookieの利用">
            <p>
              本サービスでは、ログイン状態の維持のためにCookieを使用しています。
              ブラウザの設定からCookieを無効にすることができますが、その場合ログイン機能が正常に動作しない場合があります。
            </p>
          </Section>

          <Section title="6. ポリシーの変更">
            <p>
              本ポリシーは予告なく変更することがあります。
              重要な変更がある場合はサービス上でお知らせします。
            </p>
          </Section>

          <Section title="7. お問い合わせ">
            <p>
              プライバシーに関するご質問・削除依頼は、
              <a href="/contact" className="underline text-gray-900 hover:opacity-70">お問い合わせフォーム</a>
              よりご連絡ください。
            </p>
          </Section>
        </div>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-base mb-2 text-gray-900">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}
