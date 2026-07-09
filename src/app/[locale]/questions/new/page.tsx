import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import QuestionForm from '@/components/QuestionForm'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function NewQuestionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/questions/new')
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">質問する</h1>
        <QuestionForm />
      </main>
    </>
  )
}
