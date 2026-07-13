import Header from '@/components/Header'
import QuestionDetailSkeleton from '@/components/QuestionDetailSkeleton'

export default function QuestionDetailLoading() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <QuestionDetailSkeleton />
      </main>
    </>
  )
}
