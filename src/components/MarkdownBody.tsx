'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-700
      [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto
      [&_code]:bg-gray-100 [&_code]:text-gray-800 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs
      [&_pre_code]:bg-transparent [&_pre_code]:text-gray-100 [&_pre_code]:p-0
      [&_a]:text-blue-600 [&_a]:underline
      [&_ul]:list-disc [&_ul]:list-inside
      [&_ol]:list-decimal [&_ol]:list-inside">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
