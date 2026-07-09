'use client'

import { useState, type ReactNode } from 'react'
import MarkdownBody from './MarkdownBody'

type Props = {
  title: string
  translatedTitle: string | null
  body: string
  translatedBody: string | null
  meta: ReactNode
  notice: string
  showOriginalLabel: string
  showTranslationLabel: string
}

export default function TranslatedQuestionBody({
  title,
  translatedTitle,
  body,
  translatedBody,
  meta,
  notice,
  showOriginalLabel,
  showTranslationLabel,
}: Props) {
  const hasTranslation = Boolean(translatedBody)
  const [showOriginal, setShowOriginal] = useState(false)
  const displayTitle = hasTranslation && !showOriginal ? (translatedTitle ?? title) : title
  const displayBody = hasTranslation && !showOriginal ? translatedBody! : body

  return (
    <>
      <h1 className="text-xl font-bold mb-2">{displayTitle}</h1>
      {meta}
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
