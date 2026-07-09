import Header from '@/components/Header'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          <Section title="1. 取得する情報">
            <p>本サービスでは、以下の情報を取得します。</p>
            <ul>
              <li>Googleアカウントから提供されるメールアドレス・表示名・プロフィール画像URL</li>
              <li>投稿した質問・回答の内容</li>
              <li>プロフィールに設定したスキルタグ・表示名・稼働状態</li>
              <li>アクセスログ（IPアドレス・閲覧ページ）</li>
            </ul>
            <p>氏名・住所・電話番号などの個人を特定できる情報は取得しません。</p>
          </Section>

          <Section title="2. 情報の利用目的">
            <ul>
              <li>サービスの提供・運営・改善</li>
              <li>質問と回答者のマッチング処理</li>
              <li>不正利用・スパムの防止</li>
            </ul>
          </Section>

          <Section title="3. 第三者提供・外部サービス">
            <p>
              以下の外部サービスを利用しており、各社のプライバシーポリシーが適用されます。
              当該サービスへのデータ送信を含む利用に同意した上でご使用ください。
            </p>
            <ul>
              <li>Supabase（データベース・認証）</li>
              <li>Groq（AI回答生成 ※質問内容が処理されます）</li>
              <li>Google（OAuth認証）</li>
            </ul>
            <p>上記以外の第三者へ個人情報を提供することはありません。</p>
          </Section>

          <Section title="4. データの保管・削除">
            <p>
              データはSupabaseのデータベースに保管されます。
              アカウント削除をご希望の場合は、お問い合わせフォームよりご連絡ください。できる限り対応します。
            </p>
          </Section>

          <Section title="5. Cookieの利用">
            <p>
              ログイン状態の維持のためにCookieを使用しています。
              Cookieを無効にするとログイン機能が正常に動作しない場合があります。
            </p>
          </Section>

          <Section title="6. 免責">
            <p>
              本サービスは取得した情報の安全管理に努めますが、
              完全なセキュリティを保証するものではありません。
              情報漏洩等によって生じた損害について、運営は責任を負いません。
            </p>
          </Section>

          <Section title="7. ポリシーの変更">
            <p>
              本ポリシーは予告なく変更することがあります。
              変更後も本サービスを利用した場合、変更後のポリシーに同意したものとみなします。
            </p>
          </Section>

          <Section title="8. お問い合わせ">
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
