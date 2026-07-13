import Header from '@/components/Header'
import QuestionListSkeleton from '@/components/QuestionListSkeleton'

export default function HardLoading() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-64" />
        </div>
        <div className="flex gap-4 border-b mb-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
        </div>
        <QuestionListSkeleton />
      </main>
    </>
  )
}
