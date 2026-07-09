import Header from '@/components/Header'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">使い方</h1>
        <p className="text-gray-500 text-sm mb-2">
          AIが苦手な専門的・個人的な質問を、本物の人間のエキスパートに繋げるサービスです。
        </p>
        <p className="text-gray-500 text-sm mb-2">
          AI時代だからこそ必要な、AIではできないセカンドオピニオンサービスとなります。
        </p>
        <p className="text-xs text-gray-400 mb-10">質問には Googleアカウントでログインが必要です。</p>

        <div className="space-y-10">
          <Step
            number={1}
            title="質問を投稿する"
            description="解決したい問題を投稿します。AIがまずジャンルに合った質問かを判定し、適切でない場合は受け付けません。1日に質問ができる回数は3回までです。"
            icon="●"
          />

          <Step
            number={2}
            title="AIが回答を試みる"
            description="AIがまず回答を試みます。自信を持って答えられる場合はそのまま表示され、そうでない場合は次のステップへ進みます。"
            note="AIはハルシネーション対策のチューニングを行っていますが、内容が正確とは限りません。重要な判断はご自身で確認してください。"
            icon="●"
          />

          <Step
            number={3}
            title="人間の専門家にマッチング"
            description="あなたの質問のキーワードに合うスキルを持った専門家に通知が届きます。専門家の回答で解決したらベストアンサーを選んで下さい。また、回答内容で解決できなかったり、8時間以内に回答が来なければ、二人目の専門家に解決を依頼（エスカレーション）するか、高難度質問として全ユーザーに公開し解決を求める事ができます。"
            icon="●"
          />

          <Step
            number={4}
            title="二人目の専門家にエスカレーション"
            description="一人目の専門家が解決できなかった場合、二人目の専門家に引き継がれます。8時間以内に回答がない場合は自動で高難度質問に移行します。"
            icon="●"
          />

          <Step
            number={5}
            title="高難度質問へ"
            description="AI・一人目の専門家・二人目の専門家の誰も解決できなかった質問は「高難度質問」として全ユーザーに公開され解決を求める事ができます。ユーザーの皆さん、あなたの知識で助けてください。"
            icon="▲"
          />

          <Step
            number={6}
            title="ベストアンサーを選ぶ"
            description="質問者が回答の中からベストアンサーを選ぶと質問が解決済みになります。回答した人の実績が積み上がります。"
            icon="●"
          />
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <h2 className="font-bold text-base mb-2">専門家として参加するには</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Googleアカウントでログイン</li>
            <li>マイページで得意なスキルタグを設定</li>
            <li>「今日は答えられます」をオンにする</li>
            <li>メール通知をオンにしていると、質問がマッチングされると通知が届きます</li>
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
  note,
}: {
  number: number
  title: string
  description: string
  icon: string
  note?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 flex items-start justify-start text-xl font-bold text-gray-400">
        {number}
      </div>
      <div>
        <h2 className="font-semibold text-base mb-1">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        {note && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{note}</p>
        )}
      </div>
    </div>
  )
}
