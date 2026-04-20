'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: '店舗TOP', path: '' },
  { label: 'セラピスト', path: '/therapists' },
  { label: 'スケジュール', path: '/schedule' },
  { label: '料金システム', path: '/pricing' },
  { label: 'アクセス', path: '/access' },
]

export default function StoreTabNav({ storeId }: { storeId: string }) {
  const pathname = usePathname()
  const base = `/stores/${storeId}`

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const href = `${base}${tab.path}`
            const isActive = tab.path === ''
              ? pathname === base
              : pathname.startsWith(`${base}${tab.path}`)
            return (
              <Link
                key={tab.path}
                href={href}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
