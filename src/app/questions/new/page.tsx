import Header from '@/components/Header'
import QuestionForm from '@/components/QuestionForm'

export default function NewQuestionPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-xl font-bold mb-6">質問する</h1>
        <QuestionForm />
      </main>
    </>
  )
}
