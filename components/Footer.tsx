import Link from 'next/link'

const PREFECTURES = ['東京都', '神奈川県', '埼玉県', '千葉県', '大阪府', '愛知県', '福岡県', '北海道']
const TAGS = ['オイル', 'リンパ', 'アロマ', '深夜営業', '個室', 'キャッシュレス', '駐車場']

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">エリアから探す</h3>
            <ul className="space-y-1 text-xs">
              {PREFECTURES.map((pref) => (
                <li key={pref}>
                  <Link href={`/?prefecture=${encodeURIComponent(pref)}`} className="hover:text-white">
                    {pref}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">施術タイプから探す</h3>
            <ul className="space-y-1 text-xs">
              {TAGS.map((tag) => (
                <li key={tag}>
                  <Link href={`/?tag=${encodeURIComponent(tag)}`} className="hover:text-white">
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">サイト情報</h3>
            <ul className="space-y-1 text-xs">
              <li><Link href="#" className="hover:text-white">掲載申込</Link></li>
              <li><Link href="#" className="hover:text-white">利用規約</Link></li>
              <li><Link href="#" className="hover:text-white">プライバシーポリシー</Link></li>
              <li><Link href="#" className="hover:text-white">お問い合わせ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">メンズエステ一覧</h3>
            <p className="text-xs leading-relaxed">
              信頼できるメンズエステ情報をノイズなく提供するサイトです。
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-xs text-center text-gray-500">
          © 2025 メンズエステ一覧 All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
