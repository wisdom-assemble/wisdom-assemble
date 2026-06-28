'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OwnerReviewTracker({ questionId }: { questionId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('questions')
      .update({ owner_reviewed_at: new Date().toISOString() })
      .eq('id', questionId)
      .then(() => {})
  }, [questionId])

  return null
}
