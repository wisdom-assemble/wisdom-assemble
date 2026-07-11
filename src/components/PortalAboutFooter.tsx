'use client'

import { useState } from 'react'

type Props = {
  linkLabel: string
  title: string
  body: string
}

export default function PortalAboutFooter({ linkLabel, title, body }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <footer className="mt-16 pt-10 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          {linkLabel}
        </button>
      </footer>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
            <h2 className="text-sm font-bold tracking-tight text-gray-800 mb-3 pr-6">{title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
          </div>
        </div>
      )}
    </>
  )
}
