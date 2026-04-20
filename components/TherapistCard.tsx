import Link from 'next/link'
import { Therapist, Schedule } from '@/lib/types'

const RANK_COLORS: Record<string, string> = {
  'ブラック': 'bg-gray-900 text-white',
  'プラチナ': 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  'ホワイト': 'bg-white text-gray-700 border border-gray-300',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: '今すぐ案内', color: 'bg-green-500 text-white' },
  full: { label: '予約満了', color: 'bg-red-500 text-white' },
  scheduled: { label: '本日出勤', color: 'bg-blue-500 text-white' },
}

type Props = {
  therapist: Therapist
  schedule?: Schedule | null
  storeId: string
}

export default function TherapistCard({ therapist, schedule, storeId }: Props) {
  const rankStyle = RANK_COLORS[therapist.rank ?? 'ホワイト'] ?? RANK_COLORS['ホワイト']
  const statusInfo = schedule ? STATUS_LABELS[schedule.status] : null

  return (
    <Link href={`/stores/${storeId}/therapists/${therapist.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
        {/* 写真エリア */}
        <div className="relative bg-gray-100 h-48 flex items-center justify-center">
          {therapist.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={therapist.photo_url} alt={therapist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-sm">写真なし</div>
          )}
          {/* バッジ群 */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {therapist.is_new && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded">NEW</span>
            )}
            {statusInfo && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
          {/* ランクバッジ */}
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded ${rankStyle}`}>
            {therapist.rank}
          </div>
        </div>

        {/* 情報エリア */}
        <div className="p-3">
          <h3 className="font-bold text-gray-900 text-lg mb-0.5">{therapist.name}</h3>
          <div className="text-xs text-gray-500 mb-1">
            {therapist.age && `${therapist.age}歳`}
            {therapist.height && ` / ${therapist.height}cm`}
            {therapist.bust_size && ` / (${therapist.bust_size})`}
          </div>
          {therapist.catchphrase && (
            <p className="text-xs text-gray-600 line-clamp-2">{therapist.catchphrase}</p>
          )}
          {schedule?.start_time && (
            <div className="mt-2 text-xs text-gray-500">
              出勤: {schedule.start_time.slice(0, 5)} 〜 {schedule.end_time?.slice(0, 5)}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
