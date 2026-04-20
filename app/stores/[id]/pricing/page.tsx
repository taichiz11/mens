import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'

export default async function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: store } = await supabase.from('stores').select('*').eq('id', id).single()
  if (!store) notFound()

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('store_id', id)
    .order('duration')

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">{store.name} の料金システム</h2>

          {/* 料金目安 */}
          {store.base_price && store.base_duration && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-rose-600 font-semibold mb-1">基本料金</p>
              <p className="text-3xl font-bold text-rose-700">
                ¥{store.base_price.toLocaleString()}<span className="text-lg">〜</span>
              </p>
              <p className="text-sm text-rose-500">{store.base_duration}分コースより</p>
            </div>
          )}

          {/* メニュー表 */}
          {menus && menus.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
                コース一覧
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">コース名</th>
                    <th className="text-center px-4 py-3 text-gray-600 font-medium">時間</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">料金</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{menu.name}</td>
                      <td className="text-center px-4 py-3 text-gray-600">{menu.duration}分</td>
                      <td className="text-right px-4 py-3 font-bold text-rose-700">
                        ¥{menu.price?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 mb-6">
              料金情報は準備中です
            </div>
          )}

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-semibold mb-1">ご利用に際して</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>料金は税込表示です</li>
              <li>指名料・延長料金は別途発生する場合があります</li>
              <li>詳細は店舗へ直接お問い合わせください</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
