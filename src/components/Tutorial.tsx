'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'wa_tutorial_done'

export default function Tutorial() {
  const t = useTranslations('tutorial')
  const [show, setShow] = useState(false)
  const [slide, setSlide] = useState(0)

  const slides = [
    { icon: '●', title: t('slide1Title'), body: t('slide1Body') },
    { icon: '●', title: t('slide2Title'), body: t('slide2Body') },
    { icon: '▲', title: t('slide3Title'), body: t('slide3Body') },
  ]

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  function next() {
    if (slide < slides.length - 1) {
      setSlide(slide + 1)
    } else {
      close()
    }
  }

  if (!show) return null

  const s = slides[slide]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl flex flex-col" style={{ minHeight: '360px' }}>
        <p className="text-5xl font-bold text-gray-400 mb-2 text-left leading-none">{slide + 1}</p>
        <h2 className="text-lg font-bold text-gray-900 mb-3 text-center">{s.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-8 flex-1">{s.body}</p>

        {/* ドット */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === slide ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-2.5 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {t('skip')}
          </button>
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {slide < slides.length - 1 ? t('next') : t('start')}
          </button>
        </div>
      </div>
    </div>
  )
}
