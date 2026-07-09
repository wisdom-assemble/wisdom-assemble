import Header from '@/components/Header'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">利用規約</h1>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
          <Section title="第1条（適用）">
            <p>
              本規約は、本サービスが提供するQ&Aプラットフォーム（以下「本サービス」）の利用条件を定めるものです。
              Googleアカウントでログインした時点で、本規約に同意したものとみなします。
            </p>
          </Section>

          <Section title="第2条（禁止事項）">
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <ul>
              <li>法令または公序良俗に違反する行為</li>
              <li>他のユーザーへの誹謗・中傷・脅迫・嫌がらせ</li>
              <li>電話番号・メールアドレス・LINE ID・SNSアカウントなど個人の連絡先情報の投稿</li>
              <li>スパム・広告・勧誘・営業目的の投稿</li>
              <li>医療・法律・財務に関する具体的な個別アドバイス</li>
              <li>第三者の著作権・プライバシーを侵害する行為</li>
              <li>本サービスへの不正アクセス・攻撃・過度な負荷をかける行為</li>
              <li>その他、運営が不適切と判断する行為</li>
            </ul>
          </Section>

          <Section title="第3条（投稿コンテンツ）">
            <p>
              ユーザーが投稿した質問・回答の内容については、投稿者本人が一切の責任を負います。
              本サービスは投稿内容に関し一切関与せず、その正確性・適法性・有害性について責任を負いません。
              投稿内容に起因して生じたいかなる問題・損害についても、運営は責任を負いません。
              投稿コンテンツはサービス運営・改善のために利用される場合があります。
            </p>
          </Section>

          <Section title="第4条（免責）">
            <p>
              本サービスは「現状有姿」で提供されます。
              本サービスを通じて得られた情報・回答の正確性・有用性・完全性を一切保証しません。
              本サービスの利用または利用不能によって生じたいかなる損害についても、運営は責任を負いません。
              本サービスの回答は参考情報に過ぎず、参考情報以上に使用しないでください。
              特に医療・法律・財務・投資に関する判断は、必ず資格を持った専門家の判断に従ってください。
            </p>
          </Section>

          <Section title="第5条（サービスの変更・停止）">
            <p>
              運営は予告なく本サービスの内容を変更・停止・終了できます。
              これによってユーザーに損害が生じた場合も、運営は責任を負いません。
            </p>
          </Section>

          <Section title="第6条（利用停止）">
            <p>
              本規約に違反したユーザーのアカウントを、予告なく停止・削除できます。
              停止・削除に際してユーザーへの説明・補償の義務はありません。
            </p>
          </Section>

          <Section title="第7条（規約の変更）">
            <p>
              本規約は予告なく変更することがあります。
              変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。
            </p>
          </Section>

          <Section title="第8条（お問い合わせ）">
            <p>
              ご意見は
              <a href="/contact" className="underline text-gray-900 hover:opacity-70">お問い合わせフォーム</a>
              へ。
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
