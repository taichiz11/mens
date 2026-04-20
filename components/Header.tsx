import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 text-xs text-gray-500">
          <span>全国メンズエステ一覧サイト</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-800">店舗ログイン</Link>
            <Link href="#" className="hover:text-gray-800">掲載申込</Link>
          </div>
        </div>
        <div className="py-3 flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-rose-600">
            メンズエステ一覧
          </Link>
          <nav className="hidden md:flex gap-5 text-sm text-gray-600">
            <Link href="/" className="hover:text-rose-600">ホーム</Link>
            <Link href="#" className="hover:text-rose-600">エリアから探す</Link>
            <Link href="#" className="hover:text-rose-600">セラピストランキング</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
