'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PREFECTURES = ['東京都', '神奈川県', '埼玉県', '千葉県']
const TAGS = ['オイル', 'リンパ', 'アロマ', '深夜営業', '個室', 'キャッシュレス']

export default function StoreFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPref = searchParams.get('prefecture') || ''
  const currentTag = searchParams.get('tag') || ''

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">都道府県</label>
          <select
            value={currentPref}
            onChange={(e) => updateFilter('prefecture', e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">すべて</option>
            {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-700">施術タイプ</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => updateFilter('tag', '')}
              className={`text-xs px-3 py-1 rounded-full border transition ${currentTag === '' ? 'bg-rose-600 text-white border-rose-600' : 'text-gray-600 border-gray-300 hover:border-rose-400'}`}
            >
              すべて
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => updateFilter('tag', tag)}
                className={`text-xs px-3 py-1 rounded-full border transition ${currentTag === tag ? 'bg-rose-600 text-white border-rose-600' : 'text-gray-600 border-gray-300 hover:border-rose-400'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
