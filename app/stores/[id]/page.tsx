import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'
import TherapistCard from '@/components/TherapistCard'
import Link from 'next/link'
import { Therapist, Schedule } from '@/lib/types'

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: store } = await supabase.from('stores').select('*').eq('id', id).single()
  if (!store) notFound()

  const { data: menus } = await supabase.from('menus').select('*').eq('store_id', id)
  const { data: reviews } = await supabase.from('review_summaries').select('*').eq('store_id', id)

  const today = new Date().toISOString().split('T')[0]
  const { data: therapists } = await supabase.from('therapists').select('*').eq('store_id', id)
  const { data: schedules } = await supabase.from('schedules').select('*').eq('store_id', id).eq('date', today)
  const scheduleMap = new Map<string, Schedule>()
  schedules?.forEach((s) => scheduleMap.set(s.therapist_id, s))
  const todayTherapists = therapists?.filter((t) => scheduleMap.has(t.id)) ?? []

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* パンくず */}
          <div className="text-xs text-gray-400 mb-3">
            <Link href="/" className="hover:underline">ホーム</Link>
            {' > '}
            <Link href="/" className="hover:underline">{store.prefecture || '全国'}</Link>
            {' > '}
            {store.name}
          </div>

          {/* 店舗名・キャッチコピー */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{store.name}</h1>
          {store.catchphrase && (
            <p className="text-sm text-gray-500 mb-3">{store.catchphrase}</p>
          )}

          {/* タグ */}
          {store.tags && (
            <div className="flex flex-wrap gap-1 mb-4">
              {store.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* メインコンテンツ */}
            <div className="md:col-span-2 space-y-4">

              {/* 運営コメント */}
              {store.editorial_comment && (
                <section className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <h2 className="text-sm font-bold text-rose-700 mb-1">編集部コメント</h2>
                  <p className="text-sm text-rose-900">{store.editorial_comment}</p>
                </section>
              )}

              {/* 料金システム */}
              {menus && menus.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
                    料金システム
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">コース名</th>
                        <th className="text-right px-4 py-2 text-gray-600 font-medium">時間</th>
                        <th className="text-right px-4 py-2 text-gray-600 font-medium">料金</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus.map((menu) => (
                        <tr key={menu.id} className="border-t">
                          <td className="px-4 py-2">{menu.name}</td>
                          <td className="text-right px-4 py-2">{menu.duration}分</td>
                          <td className="text-right px-4 py-2 font-medium">¥{menu.price?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* 口コミ */}
              {reviews && reviews.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
                    口コミ評価
                  </div>
                  <div className="divide-y">
                    {reviews.map((review) => (
                      <div key={review.id} className="px-4 py-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">{review.source_site}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="font-bold">{review.score}</span>
                            <span className="text-xs text-gray-400">({review.review_count}件)</span>
                          </div>
                        </div>
                        {review.summary_text && (
                          <p className="text-sm text-gray-700">{review.summary_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* サイドバー */}
            <div className="space-y-4">
              {/* 基本情報 */}
              <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">
                  基本情報
                </div>
                <dl className="divide-y text-sm">
                  {store.nearest_station && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">アクセス</dt>
                      <dd className="text-gray-800">{store.nearest_station}</dd>
                    </div>
                  )}
                  {store.address && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">住所</dt>
                      <dd className="text-gray-800">{store.address}</dd>
                    </div>
                  )}
                  {store.phone && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">電話番号</dt>
                      <dd><a href={`tel:${store.phone}`} className="text-blue-600">{store.phone}</a></dd>
                    </div>
                  )}
                  {store.opening_hours && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">営業時間</dt>
                      <dd className="text-gray-800">
                        {Object.entries(store.opening_hours).map(([k, v]) => (
                          <div key={k}>{k}: {v as string}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {store.therapist_count && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">セラピスト数</dt>
                      <dd className="text-gray-800">{store.therapist_count}名在籍</dd>
                    </div>
                  )}
                  {store.base_price && store.base_duration && (
                    <div className="px-4 py-2">
                      <dt className="text-xs text-gray-400">料金目安</dt>
                      <dd className="text-gray-800 font-medium">{store.base_duration}分 ¥{store.base_price.toLocaleString()}〜</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* 予約ボタン */}
              {store.reservation_url && (
                <a
                  href={store.reservation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition"
                >
                  ネット予約する
                </a>
              )}

              <Link href="/" className="block text-center text-sm text-gray-500 hover:underline">
                ← 一覧に戻る
              </Link>
            </div>
          </div>

          {/* 本日出勤セラピスト */}
          {todayTherapists.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">本日出勤</span>
                  {todayTherapists.length}名
                </h2>
                <Link href={`/stores/${id}/therapists`} className="text-xs text-rose-600 hover:underline">
                  全員を見る →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {todayTherapists.slice(0, 4).map((t: Therapist) => (
                  <TherapistCard key={t.id} therapist={t} schedule={scheduleMap.get(t.id)} storeId={id} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
