import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://www.esthe-ranking.jp'
const LIST_URL = `${BASE_URL}/musashikosugi/`

export type ScrapedStore = {
  name: string
  source_url: string
  official_url?: string
  nearest_station?: string
  opening_hours_text?: string
  base_price?: number
  base_duration?: number
  phone?: string
  therapist_count?: number
  tags?: string[]
  prefecture: string
}

function parsePrice(text: string): { price?: number; duration?: number } {
  const match = text.match(/(\d+)分[^\d]*([\d,]+)円/)
  if (!match) return {}
  return {
    duration: parseInt(match[1]),
    price: parseInt(match[2].replace(',', '')),
  }
}

export async function scrapeEstheRankingMusashikosugi(): Promise<ScrapedStore[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const stores: ScrapedStore[] = []

  try {
    console.log(`アクセス中: ${LIST_URL}`)
    await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const storeLinks = await page.$$eval(
      'h3 > a[href*="/shop-detail/"]',
      (els) => els.map((el) => ({
        name: el.textContent?.trim() ?? '',
        href: (el as HTMLAnchorElement).href,
      }))
    )

    console.log(`店舗数: ${storeLinks.length}件`)

    for (const link of storeLinks) {
      try {
        await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 20000 })

        // 全テキストノードを取得してパターンマッチ
        const allText = await page.$$eval('li, td, p, div', (els) =>
          els.map((el) => el.textContent?.trim() ?? '').filter((t) => t.length < 100)
        )

        // 最寄り駅：「駅」「徒歩」を含む
        const stationText = allText.find((t) => t.includes('駅') && t.includes('徒歩'))

        // 営業時間：「:00」と「～」を含む
        const hoursText = allText.find((t) => t.includes(':00') && t.includes('～') && !t.includes('円'))

        // 料金：「分」と「円」を含む
        const priceText = allText.find((t) => t.includes('円') && t.includes('分') && t.includes('/'))

        // 電話番号
        const phone = await page.$eval(
          'a[href^="tel:"]',
          (el) => (el as HTMLAnchorElement).href.replace('tel:', '')
        ).catch(() => undefined)

        // セラピスト数：「名在籍」を含む
        const therapistText = allText.find((t) => t.includes('名在籍'))
        const therapistMatch = therapistText?.match(/(\d+)名在籍/)
        const therapistCount = therapistMatch ? parseInt(therapistMatch[1]) : undefined

        // タグ（施術タイプ）
        const tags = await page.$$eval(
          `a[href*="/musashikosugi/"]`,
          (els) => els
            .map((el) => el.textContent?.trim() ?? '')
            .filter((t) => t.length > 1 && t.length < 12 && !t.includes('エリア') && !t.includes('ランキング') && !t.includes('店') && !t.includes('エステ'))
        ).catch(() => [])

        // 公式サイトURL（外部リンクのうち esthe-ranking.jp 以外）
        const officialUrl = await page.$eval(
          'a[href^="http"]:not([href*="esthe-ranking.jp"]):not([href*="twitter"]):not([href*="instagram"]):not([href*="google"])',
          (el) => (el as HTMLAnchorElement).href
        ).catch(() => undefined)

        const { price, duration } = priceText ? parsePrice(priceText) : {}

        stores.push({
          name: link.name,
          source_url: link.href,
          official_url: officialUrl,
          nearest_station: stationText,
          opening_hours_text: hoursText,
          base_price: price,
          base_duration: duration,
          phone,
          therapist_count: therapistCount,
          tags: [...new Set(tags)].slice(0, 8),
          prefecture: '神奈川県',
        })

        console.log(`✓ ${link.name} | 駅:${stationText ?? '-'} | ${duration ?? '-'}分¥${price ?? '-'} | セラピスト${therapistCount ?? '-'}名`)
        await page.waitForTimeout(800)
      } catch (err) {
        console.error(`✗ ${link.name}: ${err}`)
      }
    }

    await supabase.from('scrape_logs').insert({
      target_url: LIST_URL,
      status: 'success',
      raw_data: { stores, count: stores.length },
      scraped_at: new Date().toISOString(),
    })

    console.log(`\n完了: ${stores.length}件取得`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('scrape_logs').insert({
      target_url: LIST_URL,
      status: 'failed',
      raw_data: { error: message },
      scraped_at: new Date().toISOString(),
    })
    console.error('スクレイピングエラー:', message)
  } finally {
    await browser.close()
  }

  return stores
}

// scrape_logsのデータをstoresテーブルに流し込む
export async function importScrapedStores() {
  const { data: logs } = await supabase
    .from('scrape_logs')
    .select('*')
    .eq('status', 'success')
    .order('scraped_at', { ascending: false })
    .limit(1)

  if (!logs || logs.length === 0) {
    console.log('インポートするデータがありません')
    return
  }

  const stores = (logs[0].raw_data as { stores: ScrapedStore[] }).stores
  console.log(`${stores.length}件をインポートします...`)

  let inserted = 0
  let skipped = 0

  for (const s of stores) {
    // 既存チェック（同名店舗はスキップ）
    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('name', s.name)
      .single()

    if (existing) {
      // 既存店舗はofficial_urlだけ更新
      if (s.official_url) {
        const { error } = await supabase
          .from('stores')
          .update({ official_url: s.official_url })
          .eq('id', existing.id)
        if (!error) console.log(`  公式URL更新: ${s.name} → ${s.official_url}`)
        else console.error(`  更新エラー: ${s.name}`, error.message)
      }
      skipped++
      continue
    }

    const openingHours = s.opening_hours_text
      ? { '営業時間': s.opening_hours_text }
      : null

    await supabase.from('stores').insert({
      name: s.name,
      prefecture: s.prefecture,
      nearest_station: s.nearest_station,
      phone: s.phone,
      opening_hours: openingHours,
      base_price: s.base_price,
      base_duration: s.base_duration,
      therapist_count: s.therapist_count,
      tags: s.tags,
      reservation_url: s.source_url,
      official_url: s.official_url,
    })
    inserted++
  }

  console.log(`完了: ${inserted}件追加、${skipped}件スキップ（重複）`)
}
