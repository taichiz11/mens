'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PREFECTURES = ['東京都', '神奈川県', '埼玉県', '千葉県']

export default function StoreFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('prefecture') || ''

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value) {
      router.push(`/?prefecture=${encodeURIComponent(value)}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex gap-3 items-center">
      <label className="text-sm text-gray-600">都道府県</label>
      <select
        value={current}
        onChange={handleChange}
        className="border rounded px-3 py-1.5 text-sm"
      >
        <option value="">すべて</option>
        {PREFECTURES.map((pref) => (
          <option key={pref} value={pref}>{pref}</option>
        ))}
      </select>
    </div>
  )
}
