'use client'

import { useState } from 'react'
import MarkdownBody from './MarkdownBody'

type Props = {
  body: string
  translatedBody: string | null
  notice: string
  showOriginalLabel: string
  showTranslationLabel: string
}

export default function TranslatedAnswerBody({
  body,
  translatedBody,
  notice,
  showOriginalLabel,
  showTranslationLabel,
}: Props) {
  const hasTranslation = Boolean(translatedBody)
  const [showOriginal, setShowOriginal] = useState(false)
  const displayBody = hasTranslation && !showOriginal ? translatedBody! : body

  return (
    <>
      <MarkdownBody content={displayBody} />
      {hasTranslation && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span>{notice}</span>
          <button onClick={() => setShowOriginal((v) => !v)} className="underline hover:text-gray-600">
            {showOriginal ? showTranslationLabel : showOriginalLabel}
          </button>
        </div>
      )}
    </>
  )
}
