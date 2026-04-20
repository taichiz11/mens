import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function saveScrapeLog(data: {
  target_url: string
  status: 'success' | 'failed'
  raw_data?: object
  store_id?: string
}) {
  const { error } = await supabase.from('scrape_logs').insert({
    ...data,
    scraped_at: new Date().toISOString(),
  })
  if (error) console.error('scrape_log保存エラー:', error.message)
}
