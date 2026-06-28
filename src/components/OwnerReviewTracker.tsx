'use client'

import { useEffect } from 'react'

export default function OwnerReviewTracker({ questionId }: { questionId: string }) {
  useEffect(() => {
    fetch(`/api/questions/${questionId}/review`, { method: 'POST' })
  }, [questionId])

  return null
}
