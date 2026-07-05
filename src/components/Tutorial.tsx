'use client'

import { useState, useEffect } from 'react'

const SLIDES = [
  {
    icon: '●',
    title: 'AIが先に回答します',
    body: 'わからない事があれば「+質問をする」から投稿して下さい。投稿すると、まずAIが回答を試みます。信頼度が高い場合はAIの回答がそのまま表示されます。',
  },
  {
    icon: '●',
    title: 'AIが無理なら人間へ',
    body: 'AIが自信を持って答えられない質問は、スキルタグが一致する専門家に自動でマッチングされ人間が回答をしてくれます。AIの隙間を人間が埋めます。',
  },
  {
    icon: '▲',
    title: '高難度質問を全員参加で解決',
    body: '2人の専門家でも解決しない場合、「高難度質問」として全ユーザーに公開されます。あなたの知識が誰かを救うかもしれません。質問者を助けてあげましょう。',
  },
]

const STORAGE_KEY = 'wa_tutorial_done'

export default function Tutorial() {
  const [show, setShow] = useState(false)
  const [slide, setSlide] = useState(0)

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
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1)
    } else {
      close()
    }
  }

  if (!show) return null

  const s = SLIDES[slide]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl flex flex-col" style={{ minHeight: '360px' }}>
        <p className="text-5xl font-bold text-gray-400 mb-2 text-left leading-none">{slide + 1}</p>
        <h2 className="text-lg font-bold text-gray-900 mb-3 text-center">{s.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-8 flex-1">{s.body}</p>

        {/* ドット */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
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
            スキップ
          </button>
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {slide < SLIDES.length - 1 ? '次へ' : 'はじめる'}
          </button>
        </div>
      </div>
    </div>
  )
}
