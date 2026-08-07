// 【2026-08-08】現在このコンポーネントはどこからも使われていない。
//   質問詳細の loading.tsx で使っていたが、loading.tsx があるとページが
//   ストリーミングされ、HTTPヘッダー(200)が送信済みになるため notFound() が
//   404を返せず「削除済み質問URLが200を返すソフト404」になっていた。
//   実験で loading.tsx を外すと404になることを確認したうえで削除した
//   （generateMetadata 側で notFound() を呼ぶ案も試したが200のままで効かなかった）。
//   将来スケルトンを戻すなら、回答一覧だけをページ内 Suspense で包む形にすること。
//   ただし answers はページ全体の権限判定・JSON-LDにも使われているため、
//   切り出すには page.tsx の構造変更が必要で、相応に手が入る。
export default function QuestionDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-6 bg-gray-200 rounded w-5/6 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-6" />
      <div className="space-y-2 mb-8">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="p-4 border border-gray-100 rounded-lg space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  )
}
