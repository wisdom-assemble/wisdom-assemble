import Header from '@/components/Header'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 w-full">
        <h1 className="text-2xl font-bold mb-2">Wisdom Assembleとは？</h1>
        <p className="text-gray-500 text-sm mb-10">
          AIが苦手な専門的・個人的な質問を、本物の人間のエキスパートに繋げるサービスです。
        </p>

        <div className="space-y-10">
          <Step
            number={1}
            title="質問を投稿する"
            description="解決したい問題を投稿します。AIがまずジャンルに合った質問かを判定し、適切でない場合は受け付けません。"
            icon="✍️"
          />

          <Step
            number={2}
            title="AIが回答を試みる"
            description="信頼度スコアが閾値（87点）以上なら、AIの回答がそのまま表示されます。AIが自信を持てない場合は次のステップへ。"
            icon="🤖"
          />

          <Step
            number={3}
            title="人間の専門家にマッチング（B）"
            description="あなたの質問のキーワードに合うスキルを持った回答者Bに通知が届きます。24時間以内に回答が来なければ自動でエスカレーション。"
            icon="🤝"
          />

          <Step
            number={4}
            title="別の専門家にエスカレーション（C）"
            description="Bが解決できなかった場合、別の回答者Cに引き継がれます。それでも解決できない場合は次のステップへ。"
            icon="🔄"
          />

          <Step
            number={5}
            title="高難度クエストボード"
            description="AI・B・Cの誰も解決できなかった質問は「高難度クエスト」として全ユーザーに公開されます。あなたの知識で助けてください。"
            icon="🔥"
          />

          <Step
            number={6}
            title="ベストアンサーを選ぶ"
            description="質問者が回答の中からベストアンサーを選ぶと質問が解決済みになります。回答した人の実績が積み上がります。"
            icon="✅"
          />
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <h2 className="font-bold text-base mb-2">回答者として参加するには</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Googleアカウントでログイン</li>
            <li>プロフィールで得意なスキルタグを設定</li>
            <li>「今日は答えられます」をオンにする</li>
            <li>質問がマッチングされると通知（将来実装予定）が届きます</li>
          </ol>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/questions/new"
            className="flex-1 text-center py-2.5 rounded font-medium text-white text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            質問してみる
          </Link>
          <Link
            href="/"
            className="flex-1 text-center py-2.5 rounded font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            質問一覧へ
          </Link>
        </div>
      </main>
    </>
  )
}

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">STEP {number}</p>
        <h2 className="font-semibold text-base mb-1">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
