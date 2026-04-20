export type Store = {
  id: string
  name: string
  prefecture: string | null
  address: string | null
  nearest_station: string | null
  phone: string | null
  opening_hours: Record<string, string> | null
  reservation_url: string | null
  photos: string[] | null
  editorial_comment: string | null
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
