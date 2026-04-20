import Link from 'next/link'
import { Store } from '@/lib/types'

const RANK_COLORS: Record<number, string> = {
  1: 'bg-yellow-400 text-white',
  2: 'bg-gray-300 text-white',
  3: 'bg-amber-600 text-white',
}

export default function StoreCard({ store }: { store: Store }) {
  const rankColor = store.ranking ? (RANK_COLORS[store.ranking] ?? 'bg-rose-500 text-white') : 'bg-rose-500 text-white'

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="flex gap-4 p-4">
        {/* ランキングバッジ */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${rankColor}`}>
            {store.ranking ?? '-'}
          </div>
          {/* サムネイル */}
          <div className="w-24 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
            写真
          </div>
        </div>

        {/* 店舗情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link href={`/stores/${store.id}`}>
              <h2 className="font-bold text-lg text-gray-900 hover:text-rose-600 leading-tight">
                {store.name}
              </h2>
            </Link>
          </div>

          {store.catchphrase && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{store.catchphrase}</p>
          )}

          {/* タグ */}
          {store.tags && store.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {store.tags.map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 基本情報 */}
          <div className="text-sm text-gray-600 space-y-0.5">
            {store.nearest_station && (
              <div>📍 {store.nearest_station}</div>
            )}
            {store.opening_hours && (
              <div>🕐 {Object.entries(store.opening_hours).map(([k, v]) => `${k} ${v}`).join(' / ')}</div>
            )}
            {store.base_price && store.base_duration && (
              <div>💴 {store.base_duration}分 / ¥{store.base_price.toLocaleString()}〜</div>
            )}
            {store.therapist_count && (
              <div>👤 セラピスト {store.therapist_count}名在籍</div>
            )}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="border-t border-gray-100 px-4 py-2 flex justify-between items-center bg-gray-50">
        {store.phone && (
          <a href={`tel:${store.phone}`} className="text-sm text-blue-600 hover:underline">
            📞 {store.phone}
          </a>
        )}
        <div className="flex gap-2 ml-auto">
          <Link href={`/stores/${store.id}`} className="text-sm text-rose-600 hover:underline font-medium">
            店舗情報を見る →
          </Link>
          {store.reservation_url && (
            <a href={store.reservation_url} target="_blank" rel="noopener noreferrer"
              className="text-sm bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700">
              ネット予約
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
