import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreTabNav from '@/components/StoreTabNav'
import TherapistCard from '@/components/TherapistCard'
import { Therapist, Schedule } from '@/lib/types'

export default async function TherapistsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: store } = await supabase.from('stores').select('id, name').eq('id', id).single()
  if (!store) notFound()

  const { data: therapists } = await supabase
    .from('therapists')
    .select('*')
    .eq('store_id', id)
    .order('created_at')

  const today = new Date().toISOString().split('T')[0]
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('store_id', id)
    .eq('date', today)

  const scheduleMap = new Map<string, Schedule>()
  schedules?.forEach((s) => scheduleMap.set(s.therapist_id, s))

  const todayTherapists = therapists?.filter((t) => scheduleMap.has(t.id)) ?? []
  const otherTherapists = therapists?.filter((t) => !scheduleMap.has(t.id)) ?? []

  return (
    <>
      <Header />
      <StoreTabNav storeId={id} />
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {store.name} のセラピスト一覧
          </h2>

          {todayTherapists.length > 0 && (
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">本日出勤</span>
                {todayTherapists.length}名
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {todayTherapists.map((t: Therapist) => (
                  <TherapistCard
                    key={t.id}
                    therapist={t}
                    schedule={scheduleMap.get(t.id)}
                    storeId={id}
                  />
                ))}
              </div>
            </section>
          )}

          {otherTherapists.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">在籍セラピスト</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {otherTherapists.map((t: Therapist) => (
                  <TherapistCard
                    key={t.id}
                    therapist={t}
                    schedule={null}
                    storeId={id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
