import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'
import Link from 'next/link'

export default async function TherapistDetailPage({
  params,
}: {
  params: Promise<{ id: string; tid: string }>
}) {
  const { id, tid } = await params

  const { data: therapist } = await supabase
    .from('therapists')
    .select('*')
    .eq('id', tid)
    .single()
  if (!therapist) notFound()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const { data: todaySchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('therapist_id', tid)
    .eq('date', today)
    .single()

  const { data: upcomingSchedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('therapist_id', tid)
    .gte('date', today)
    .order('date')
    .limit(7)

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    available: { label: '今すぐ案内可能', color: 'bg-green-500 text-white' },
    full: { label: '予約満了', color: 'bg-red-500 text-white' },
    scheduled: { label: '本日出勤予定', color: 'bg-blue-500 text-white' },
  }

  const RANK_COLORS: Record<string, string> = {
    'ブラック': 'bg-gray-900 text-white',
    'プラチナ': 'bg-gray-200 text-gray-800',
    'ホワイト': 'bg-white text-gray-700 border border-gray-300',
  }

  const rankStyle = RANK_COLORS[therapist.rank ?? 'ホワイト'] ?? RANK_COLORS['ホワイト']
  const statusInfo = todaySchedule ? STATUS_LABELS[todaySchedule.status] : null

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* パンくず */}
          <div className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:underline">ホーム</Link>
            {' > '}
            <Link href={`/stores/${id}`} className="hover:underline">{store?.name}</Link>
            {' > '}
            <Link href={`/stores/${id}/therapists`} className="hover:underline">セラピスト</Link>
            {' > '}
            {therapist.name}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 写真・基本情報 */}
            <div className="space-y-3">
              <div className="relative bg-gray-100 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                {therapist.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={therapist.photo_url} alt={therapist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm">写真なし</div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {therapist.is_new && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded">NEW</span>
                  )}
                </div>
                <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded ${rankStyle}`}>
                  {therapist.rank}
                </div>
              </div>

              {/* 今日のステータス */}
              {statusInfo && (
                <div className={`text-center py-2 rounded-lg font-bold text-sm ${statusInfo.color}`}>
                  {statusInfo.label}
                  {todaySchedule?.start_time && (
                    <div className="text-xs font-normal mt-0.5">
                      {todaySchedule.start_time.slice(0, 5)} 〜 {todaySchedule.end_time?.slice(0, 5)}
                    </div>
                  )}
                </div>
              )}

              {/* スペック */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-800 text-white px-3 py-2 text-xs font-semibold">プロフィール</div>
                <dl className="divide-y text-sm">
                  <div className="px-3 py-2 flex justify-between">
                    <dt className="text-gray-500">年齢</dt>
                    <dd>{therapist.age ? `${therapist.age}歳` : '-'}</dd>
                  </div>
                  <div className="px-3 py-2 flex justify-between">
                    <dt className="text-gray-500">身長</dt>
                    <dd>{therapist.height ? `${therapist.height}cm` : '-'}</dd>
                  </div>
                  <div className="px-3 py-2 flex justify-between">
                    <dt className="text-gray-500">バスト</dt>
                    <dd>{therapist.bust_size ? `(${therapist.bust_size})` : '-'}</dd>
                  </div>
                </dl>
              </div>

              {therapist.sns_x && (
                <a href={therapist.sns_x} target="_blank" rel="noopener noreferrer"
                  className="block text-center text-sm bg-black text-white py-2 rounded-lg hover:opacity-80">
                  X (Twitter) をフォロー
                </a>
              )}
            </div>

            {/* 右カラム */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{therapist.name}</h1>
                {therapist.catchphrase && (
                  <p className="text-gray-500 text-sm mt-1 italic">"{therapist.catchphrase}"</p>
                )}
              </div>

              {therapist.profile && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">自己紹介</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{therapist.profile}</p>
                </div>
              )}

              {/* 出勤スケジュール */}
              {upcomingSchedules && upcomingSchedules.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold">出勤スケジュール</div>
                  <div className="divide-y">
                    {upcomingSchedules.map((s) => {
                      const statusInfo = STATUS_LABELS[s.status]
                      return (
                        <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">{s.date}</span>
                            <span className="text-gray-500 ml-2 text-xs">
                              {s.start_time?.slice(0, 5)} 〜 {s.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo?.color}`}>
                            {statusInfo?.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Link
                href={`/stores/${id}/therapists`}
                className="block text-center text-sm text-gray-500 hover:underline"
              >
                ← セラピスト一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
