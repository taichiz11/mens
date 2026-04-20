import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'

export default async function AccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: store } = await supabase.from('stores').select('*').eq('id', id).single()
  if (!store) notFound()

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">{store.name} のアクセス</h2>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">店舗情報</div>
            <dl className="divide-y text-sm">
              {store.address && (
                <div className="px-4 py-3 flex gap-4">
                  <dt className="text-gray-500 w-24 shrink-0">住所</dt>
                  <dd className="text-gray-800">{store.address}</dd>
                </div>
              )}
              {store.nearest_station && (
                <div className="px-4 py-3 flex gap-4">
                  <dt className="text-gray-500 w-24 shrink-0">最寄り駅</dt>
                  <dd className="text-gray-800">{store.nearest_station}</dd>
                </div>
              )}
              {store.phone && (
                <div className="px-4 py-3 flex gap-4">
                  <dt className="text-gray-500 w-24 shrink-0">電話番号</dt>
                  <dd>
                    <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">
                      {store.phone}
                    </a>
                  </dd>
                </div>
              )}
              {store.opening_hours && (
                <div className="px-4 py-3 flex gap-4">
                  <dt className="text-gray-500 w-24 shrink-0">営業時間</dt>
                  <dd className="text-gray-800">
                    {Object.entries(store.opening_hours).map(([k, v]) => (
                      <div key={k}>{k}: {v as string}</div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 地図（Google Maps埋め込み用プレースホルダー） */}
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500 text-sm">
            地図はこちらに表示されます
          </div>

          {store.reservation_url && (
            <a
              href={store.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition mt-4"
            >
              ネット予約する
            </a>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
