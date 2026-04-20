import { chromium } from 'playwright'
import { saveScrapeLog } from '../utils/db'

// ホットペッパービューティー メンズエステ 武蔵小杉エリア
const TARGET_URL = 'https://beauty.hotpepper.jp/CSP/bt/salonList/sacBC110/?freeWord=%E3%83%A1%E3%83%B3%E3%82%BA&condSex=2'

export type ScrapedStore = {
  name: string
  address?: string
  nearest_station?: string
  rating?: number
  review_count?: number
  url?: string
}

export async function scrapeHotpepper(): Promise<ScrapedStore[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const stores: ScrapedStore[] = []

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const items = await page.$$('.slnListSearch li.slnListSearchCassette')

    for (const item of items) {
      const name = await item.$eval('.slnName a', el => el.textContent?.trim()).catch(() => '')
      const address = await item.$eval('.address', el => el.textContent?.trim()).catch(() => '')
      const station = await item.$eval('.access', el => el.textContent?.trim()).catch(() => '')
      const ratingText = await item.$eval('.hpbScoreNumber', el => el.textContent?.trim()).catch(() => '')
      const reviewText = await item.$eval('.reviewCnt', el => el.textContent?.trim()).catch(() => '')
      const url = await item.$eval('.slnName a', el => (el as HTMLAnchorElement).href).catch(() => '')

      if (name) {
        stores.push({
          name,
          address: address || undefined,
          nearest_station: station || undefined,
          rating: ratingText ? parseFloat(ratingText) : undefined,
          review_count: reviewText ? parseInt(reviewText.replace(/[^0-9]/g, '')) : undefined,
          url: url || undefined,
        })
      }
    }

    await saveScrapeLog({
      target_url: TARGET_URL,
      status: 'success',
      raw_data: { stores, count: stores.length },
    })

    console.log(`取得件数: ${stores.length}件`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await saveScrapeLog({ target_url: TARGET_URL, status: 'failed', raw_data: { error: message } })
    console.error('スクレイピングエラー:', message)
  } finally {
    await browser.close()
  }

  return stores
}
