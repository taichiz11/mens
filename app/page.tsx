import { supabase } from '@/lib/supabase'
import { Store } from '@/lib/types'
import StoreCard from '@/components/StoreCard'
import StoreFilter from '@/components/StoreFilter'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string }>
}) {
  const { prefecture } = await searchParams
  let query = supabase.from('stores').select('*').order('name')

  if (prefecture) {
    query = query.eq('prefecture', prefecture)
  }

  const { data: stores } = await query

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">メンズエステ一覧</h1>
      <p className="text-gray-500 mb-6">信頼できる店舗情報を、ノイズなく探せる</p>

      <StoreFilter />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {stores?.map((store: Store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>

      {stores?.length === 0 && (
        <p className="text-center text-gray-400 mt-12">該当する店舗が見つかりませんでした</p>
      )}
    </main>
  )
}
