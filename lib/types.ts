export type Store = {
  id: string
  name: string
  catchphrase: string | null
  prefecture: string | null
  address: string | null
  nearest_station: string | null
  phone: string | null
  opening_hours: Record<string, string> | null
  reservation_url: string | null
  photos: string[] | null
  editorial_comment: string | null
  tags: string[] | null
  therapist_count: number | null
  base_price: number | null
  base_duration: number | null
  ranking: number | null
  created_at: string
  updated_at: string
}

export type Menu = {
  id: string
  store_id: string
  name: string | null
  duration: number | null
  price: number | null
}

export type ReviewSummary = {
  id: string
  store_id: string
  source_site: string | null
  score: number | null
  review_count: number | null
  summary_text: string | null
  scraped_at: string | null
}

export type Therapist = {
  id: string
  store_id: string
  name: string
  age: number | null
  height: number | null
  bust_size: string | null
  photo_url: string | null
  catchphrase: string | null
  rank: string | null
  profile: string | null
  is_new: boolean
  sns_x: string | null
  created_at: string
}

export type Schedule = {
  id: string
  therapist_id: string
  store_id: string
  date: string
  start_time: string | null
  end_time: string | null
  status: 'available' | 'full' | 'scheduled'
}
