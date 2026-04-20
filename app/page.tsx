import { supabase } from '@/lib/supabase'
import { Store } from '@/lib/types'
import StoreCard from '@/components/StoreCard'
import StoreFilter from '@/components/StoreFilter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; tag?: string }>
}) {
  const { prefecture, tag } = await searchParams

  let query = supabase.from('stores').select('*').order('ranking', { ascending: true, nullsFirst: false })

  if (prefecture) query = query.eq('prefecture', prefecture)
  if (tag) query = query.contains('tags', [tag])

  const { data: stores } = await query

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* パンくず */}
          <div className="text-xs text-gray-400 mb-3">
            ホーム &gt; {prefecture || '全国'} &gt; メンズエステ一覧
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {prefecture || '全国'}のメンズエステ一覧
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {stores?.length ?? 0}件掲載中 ・ 信頼できる店舗情報をノイズなく探せる
          </p>

          {/* フィルター */}
          <StoreFilter />

          {/* 店舗一覧 */}
          <div className="space-y-3">
            {stores?.map((store: Store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>

          {stores?.length === 0 && (
            <div className="text-center text-gray-400 py-16">
              該当する店舗が見つかりませんでした
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
