import Link from 'next/link'
import { Store } from '@/lib/types'

export default function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={`/stores/${store.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer h-full">
        <h2 className="font-semibold text-lg mb-1 line-clamp-1">{store.name}</h2>
        <p className="text-sm text-gray-500 mb-2">{store.nearest_station}</p>
        {store.editorial_comment && (
          <p className="text-sm text-gray-700 line-clamp-2">{store.editorial_comment}</p>
        )}
      </div>
    </Link>
  )
}
