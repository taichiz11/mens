import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'
import Link from 'next/link'

function getWeekDates() {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d)
  }
  return dates
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: '今すぐ案内', color: 'text-green-700', bg: 'bg-green-100' },
  full: { label: '予約満了', color: 'text-red-700', bg: 'bg-red-100' },
  scheduled: { label: '出勤予定', color: 'text-blue-700', bg: 'bg-blue-100' },
}

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const { date } = await searchParams

  const { data: store } = await supabase.from('stores').select('id, name').eq('id', id).single()
  if (!store) notFound()

  const weekDates = getWeekDates()
  const today = weekDates[0].toISOString().split('T')[0]
  const selectedDate = date ?? today

  const { data: schedules } = await supabase
    .from('schedules')
    .select('*, therapists(*)')
    .eq('store_id', id)
    .eq('date', selectedDate)
    .order('start_time')

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{store.name} の出勤スケジュール</h2>

          {/* 日付タブ */}
          <div className="flex gap-1 overflow-x-auto mb-6 bg-white border border-gray-200 rounded-lg p-2">
            {weekDates.map((d) => {
              const dateStr = d.toISOString().split('T')[0]
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === today
              const dayLabel = DAY_LABELS[d.getDay()]
              return (
                <Link
                  key={dateStr}
                  href={`/stores/${id}/schedule?date=${dateStr}`}
                  className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-sm transition ${
                    isSelected
                      ? 'bg-rose-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'text-rose-100' : 'text-gray-400'}`}>
                    {isToday ? '今日' : dayLabel}
                  </span>
                  <span className="font-bold">{d.getDate()}</span>
                </Link>
              )
            })}
          </div>

          {/* 出勤セラピスト一覧 */}
          {schedules && schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((s) => {
                const t = s.therapists as Record<string, unknown>
                const statusCfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled
                return (
                  <Link key={s.id} href={`/stores/${id}/therapists/${t.id}`}>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition">
                      {/* 写真 */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                        {t.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.photo_url as string} alt={t.name as string} className="w-full h-full object-cover" />
                        ) : '写真'}
                      </div>

                      {/* 情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-gray-900">{t.name as string}</span>
                          {t.is_new && (
                            <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded">NEW</span>
                          )}
                          <span className="text-xs text-gray-500">
                            {t.rank as string}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.age as number}歳 / {t.height as number}cm
                          {t.bust_size ? ` / (${t.bust_size as string})` : ''}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          出勤: {s.start_time?.slice(0, 5)} 〜 {s.end_time?.slice(0, 5)}
                        </div>
                      </div>

                      {/* ステータス */}
                      <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg ${statusCfg.color} ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-16">
              この日の出勤情報はありません
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
