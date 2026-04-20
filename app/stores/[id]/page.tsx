import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function StorePage({ params }: { params: { id: string } }) {
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!store) notFound()

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('store_id', params.id)

  const { data: reviews } = await supabase
    .from('review_summaries')
    .select('*')
    .eq('store_id', params.id)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <a href="/" className="text-blue-500 text-sm mb-4 inline-block">← 一覧に戻る</a>

      <h1 className="text-3xl font-bold mb-1">{store.name}</h1>
      <p className="text-gray-500 mb-6">{store.nearest_station}</p>

      {/* 運営コメント */}
      {store.editorial_comment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-blue-700 mb-1">運営コメント</p>
          <p className="text-blue-900">{store.editorial_comment}</p>
        </div>
      )}

      {/* 基本情報 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">基本情報</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">住所</dt>
            <dd>{store.address}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">電話番号</dt>
            <dd>{store.phone}</dd>
          </div>
          {store.opening_hours && (
            <div className="flex gap-4">
              <dt className="text-gray-500 w-24 shrink-0">営業時間</dt>
              <dd>
                {Object.entries(store.opening_hours).map(([day, hours]) => (
                  <div key={day}>{day}: {hours as string}</div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* メニュー */}
      {menus && menus.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">コース・料金</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">コース名</th>
                  <th className="text-right px-4 py-2">時間</th>
                  <th className="text-right px-4 py-2">料金</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id} className="border-t">
                    <td className="px-4 py-2">{menu.name}</td>
                    <td className="text-right px-4 py-2">{menu.duration}分</td>
                    <td className="text-right px-4 py-2">¥{menu.price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 口コミスコア */}
      {reviews && reviews.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">口コミ評価</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">{review.source_site}</span>
                  <span className="font-bold text-lg">{review.score} <span className="text-yellow-400">★</span></span>
                </div>
                {review.summary_text && (
                  <p className="text-sm text-gray-700">{review.summary_text}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 予約 */}
      {store.reservation_url && (
        <a
          href={store.reservation_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          予約する
        </a>
      )}
    </main>
  )
}
