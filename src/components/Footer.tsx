import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 py-6 text-center text-xs text-gray-400">
      <div className="flex justify-center gap-6 flex-wrap">
        <Link href="/terms" className="hover:text-gray-600 transition-colors">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
        <Link href="/contact" className="hover:text-gray-600 transition-colors">お問い合わせ</Link>
      </div>
    </footer>
  )
}
