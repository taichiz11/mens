import { chromium, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TherapistData = {
  store_id: string
  name: string
  age?: number
  height?: number
  bust_size?: string
  photo_url?: string
  profile?: string
  is_new?: boolean
}

type MenuData = {
  store_id: string
  name: string
  duration?: number
  price?: number
}

type ScheduleData = {
  store_id: string
  therapist_id: string
  date: string
  start_time?: string
  end_time?: string
  status: string
}

// トップページから目的のページへのリンクを探す
async function findSectionUrl(page: Page, baseUrl: string, keywords: string[]): Promise<string | null> {
  try {
    const links = await page.$$eval('a', (els) =>
      els.map((el) => ({
        text: el.textContent?.trim() ?? '',
        href: (el as HTMLAnchorElement).href,
      }))
    )

    for (const kw of keywords) {
      const match = links.find((l) =>
        l.text.includes(kw) && l.href.startsWith('http') && !l.href.includes('twitter') && !l.href.includes('instagram')
      )
      if (match) return match.href
    }
  } catch {
    // ignore
  }
  return null
}

// セラピスト情報をスクレイプ
async function scrapeTherapists(page: Page, baseUrl: string, storeId: string): Promise<TherapistData[]> {
  const therapists: TherapistData[] = []

  // トップページ読み込み
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
  } catch {
    console.log(`  サイト読み込み失敗: ${baseUrl}`)
    return therapists
  }

  // スタッフページのURLを自動検出
  const staffUrl = await findSectionUrl(page, baseUrl, ['スタッフ', 'セラピスト', 'キャスト', 'CAST', 'STAFF', '在籍'])
    ?? `${baseUrl}/staff.php`

  try {
    await page.goto(staffUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

    // 写真URLを取得
    const photoUrls = await page.$$eval('img',
      (imgs) => imgs
        .map((img) => (img as HTMLImageElement).src)
        .filter((src) => src.includes('staff') || src.includes('cast') || src.includes('therapist') || src.includes('girl') || src.includes('lady'))
    ).catch(() => [])

    // 名前・年齢・スペックのテキストブロックを取得
    const blocks = await page.$$eval('div, li, tr, article, section', (els) =>
      els
        .map((el) => el.textContent?.trim() ?? '')
        .filter((t) => t.includes('歳') && t.length > 5 && t.length < 300)
    ).catch(() => [])

    blocks.forEach((block, i) => {
      // "西野　みさと(29歳)" や "みさと 29歳" の形式をパース
      const nameMatch = block.match(/^(.{2,10}?)[\s　]*[\(（]?(\d{2})歳[\)）]?/)
        ?? block.match(/([^\s　\n]{2,8})\s*\n?\s*(\d{2})歳/)
      if (!nameMatch) return

      const name = nameMatch[1].trim().replace(/[\s\n]+/g, '')
      const age = parseInt(nameMatch[2])

      if (name.length < 2 || name.length > 10) return
      // 数字や記号のみの名前を除外
      if (/^[\d\s！-～]+$/.test(name)) return

      // 身長
      const heightMatch = block.match(/T[.\s:：]*(\d{3})|身長[^\d]*(\d{3})/)
      const height = heightMatch ? parseInt(heightMatch[1] ?? heightMatch[2]) : undefined

      // バストサイズ
      const bustMatch = block.match(/B[.\s:：]*\d+[\s]*[\(（]?([A-Z])[\)）]?|バスト[^\d]*\d+[\s]*[\(（]?([A-Z])[\)）]?/)
      const bustSize = bustMatch ? (bustMatch[1] ?? bustMatch[2]) : undefined

      // 新人判定
      const isNew = block.includes('新人') || block.includes('NEW') || block.includes('新着')

      therapists.push({
        store_id: storeId,
        name,
        age,
        height,
        bust_size: bustSize,
        photo_url: photoUrls[i] ?? undefined,
        is_new: isNew,
      })
    })

    // 重複除去
    const seen = new Set<string>()
    const unique = therapists.filter((t) => {
      if (seen.has(t.name)) return false
      seen.add(t.name)
      return true
    })

    console.log(`  セラピスト: ${unique.length}名 (${staffUrl})`)
    return unique
  } catch {
    console.log(`  スタッフページ取得失敗: ${staffUrl}`)
    return therapists
  }
}

// 料金情報をスクレイプ
async function scrapeMenus(page: Page, baseUrl: string, storeId: string): Promise<MenuData[]> {
  const menus: MenuData[] = []

  // 料金ページを自動検出（すでにサイトにいる状態）
  let menuUrl: string | null = null
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    menuUrl = await findSectionUrl(page, baseUrl, ['料金', 'システム', 'コース', 'メニュー', 'MENU', 'PRICE', 'SYSTEM'])
      ?? `${baseUrl}/system.php`
  } catch {
    menuUrl = `${baseUrl}/system.php`
  }

  try {
    await page.goto(menuUrl!, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const rows = await page.$$eval('tr, li, p, div', (els) =>
      els.map((el) => el.textContent?.trim() ?? '').filter((t) => t.includes('分') && t.includes('円') && t.length < 200)
    ).catch(() => [])

    const seen = new Set<string>()
    rows.forEach((row) => {
      const match = row.match(/(\d+)分[^\d]*([\d,]+)円/)
      if (!match) return

      const duration = parseInt(match[1])
      const price = parseInt(match[2].replace(/,/g, ''))
      const key = `${duration}-${price}`

      if (duration >= 30 && duration <= 300 && price >= 1000 && !seen.has(key)) {
        seen.add(key)
        const name = `${duration}分コース`
        menus.push({ store_id: storeId, name, duration, price })
      }
    })

    console.log(`  メニュー: ${menus.length}件 (${menuUrl})`)
  } catch {
    console.log(`  料金ページ取得失敗: ${menuUrl}`)
  }

  return menus
}

// 出勤スケジュールをスクレイプ
async function scrapeSchedules(
  page: Page,
  baseUrl: string,
  storeId: string,
  therapistMap: Map<string, string>
): Promise<ScheduleData[]> {
  const schedules: ScheduleData[] = []
  const today = new Date().toISOString().split('T')[0]

  let scheduleUrl: string | null = null
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    scheduleUrl = await findSectionUrl(page, baseUrl, ['出勤', 'スケジュール', 'SCHEDULE', '本日'])
      ?? `${baseUrl}/schedule.php`
  } catch {
    scheduleUrl = `${baseUrl}/schedule.php`
  }

  try {
    await page.goto(scheduleUrl!, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const blocks = await page.$$eval('div, li, tr, p', (els) =>
      els.map((el) => el.textContent?.trim() ?? '').filter((t) =>
        t.includes(':00') && t.length < 150
      )
    ).catch(() => [])

    blocks.forEach((block) => {
      const timeMatch = block.match(/(\d{1,2}:\d{2})[〜～\-–](\d{1,2}:\d{2})/)
      if (!timeMatch) return

      const startTime = timeMatch[1]
      const endTime = timeMatch[2]

      for (const [name, therapistId] of therapistMap) {
        if (block.includes(name)) {
          schedules.push({
            store_id: storeId,
            therapist_id: therapistId,
            date: today,
            start_time: startTime,
            end_time: endTime,
            status: 'available',
          })
          break
        }
      }
    })

    console.log(`  スケジュール: ${schedules.length}件`)
  } catch {
    console.log(`  スケジュールページ取得失敗: ${scheduleUrl}`)
  }

  return schedules
}

// メイン：公式サイトのある店舗を全件処理（esthe-works.jpは除外）
export async function scrapeOfficialSites() {
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, official_url')
    .not('official_url', 'is', null)
    .not('official_url', 'like', '%esthe-works.jp%')
    .order('created_at')

  if (!stores || stores.length === 0) {
    console.log('独自公式サイトURLのある店舗がありません。')
    return
  }

  console.log(`独自公式サイトあり: ${stores.length}店舗\n`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja,en;q=0.9' })

  for (const store of stores) {
    console.log(`\n[${store.name}] ${store.official_url}`)

    try {
      const baseUrl = store.official_url!.replace(/\/$/, '').replace(/\/index\.html?$/, '')

      // セラピスト取得・保存
      const therapists = await scrapeTherapists(page, baseUrl, store.id)
      const therapistMap = new Map<string, string>()

      for (const t of therapists) {
        const { data: existing } = await supabase
          .from('therapists')
          .select('id')
          .eq('store_id', store.id)
          .eq('name', t.name)
          .single()

        if (!existing) {
          const { data: inserted } = await supabase
            .from('therapists')
            .insert(t)
            .select('id')
            .single()
          if (inserted) therapistMap.set(t.name, inserted.id)
        } else {
          therapistMap.set(t.name, existing.id)
        }
      }

      // 料金取得・保存
      const menus = await scrapeMenus(page, baseUrl, store.id)
      for (const m of menus) {
        const { data: existing } = await supabase
          .from('menus')
          .select('id')
          .eq('store_id', store.id)
          .eq('duration', m.duration)
          .single()

        if (!existing) {
          await supabase.from('menus').insert(m)
        }
      }

      // スケジュール取得・保存
      if (therapistMap.size > 0) {
        const schedules = await scrapeSchedules(page, baseUrl, store.id, therapistMap)
        for (const s of schedules) {
          await supabase.from('schedules').upsert(s, { onConflict: 'therapist_id,date' })
        }
      }

      await page.waitForTimeout(1500)
    } catch (err) {
      console.error(`  エラー: ${err}`)
    }
  }

  await browser.close()
  console.log('\n=== 全店舗の処理完了 ===')
}
