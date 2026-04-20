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
  is_new?: boolean
}
type MenuData = { store_id: string; name: string; duration?: number; price?: number }
type ScheduleData = { store_id: string; therapist_id: string; date: string; start_time?: string; end_time?: string; status: string }

// ─── ユーティリティ ───────────────────────────────────────────

function stripEmoji(str: string): string {
  return str.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[‼️⁉️‼⁉！]/gu, '').trim()
}

function parseName(text: string): { name: string; age: number } | null {
  const t = stripEmoji(text)
  const p1 = t.match(/^(?:NEW|new|【NEW】|新人)?\s*([^\d\n（(]{2,10}?)\s*[（(]?(\d{2})歳/)
  if (p1) return { name: stripEmoji(p1[1]).trim().replace(/[\s　]+/g, ''), age: parseInt(p1[2]) }
  const p2 = t.match(/^([^\d]{2,8})(\d{2})歳/)
  if (p2) return { name: stripEmoji(p2[1]).trim(), age: parseInt(p2[2]) }
  const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length >= 2) {
    const nameLine = stripEmoji(lines[0].replace(/NEW|new|【.*?】|新人/g, '')).trim()
    const ageLine = lines.find(l => /^\d{2}歳/.test(l) || /^\d{2}$/.test(l))
    if (ageLine && nameLine.length >= 2 && nameLine.length <= 10)
      return { name: nameLine, age: parseInt(ageLine) }
  }
  return null
}

function parseHeight(text: string): number | undefined {
  const m = text.match(/T[.:\s]*(\d{3})|T(\d{3})|身長[^\d]*(\d{3})|(\d{3})cm/)
  if (m) return parseInt(m[1] ?? m[2] ?? m[3] ?? m[4])
}

function parseBust(text: string): string | undefined {
  const m = text.match(/B[.\s:]*\d+[\s]*[（(]([A-Z])[）)]|([A-Z])カップ|[(（]([A-Z])[)）]|B\d+[(（]([A-Z])[)）]/)
  if (m) return m[1] ?? m[2] ?? m[3] ?? m[4]
}

function parseTimes(text: string): { start: string; end: string } | null {
  const m1 = text.match(/(\d{1,2}:\d{2})\s*[〜～\-–]\s*(\d{1,2}:\d{2})/)
  if (m1) return { start: m1[1], end: m1[2] }
  const m3 = text.match(/(\d{1,2}:\d{2})\s*[〜～\-–]\s*(ラスト|LAST|last)/)
  if (m3) return { start: m3[1], end: '29:00' }
  const m2 = text.match(/(\d{2}:\d{2})(\d{2}:\d{2})/)
  if (m2) return { start: m2[1], end: m2[2] }
  return null
}

async function findLink(page: Page, keywords: string[]): Promise<string | null> {
  const links = await page.$$eval('a', els =>
    els.map(e => ({ text: e.textContent?.trim().replace(/\s+/g, ' ') ?? '', href: (e as HTMLAnchorElement).href }))
  ).catch(() => [] as { text: string; href: string }[])
  for (const kw of keywords) {
    const m = links.find(l => l.text.includes(kw) && l.href.startsWith('http'))
    if (m) return m.href
  }
  return null
}

// ─── CMS判定 ─────────────────────────────────────────────────

function detectCms(url: string): 'wiv' | 'listcms' | 'healrelax' | 'wordpress' | 'generic' {
  if (url.includes('wiv.jp') || url.includes('okok.biz')) return 'wiv'
  if (url.includes('?list_3') || url.includes('a-side.com')) return 'listcms'
  if (url.includes('healrelax.info')) return 'healrelax'
  return 'generic'
}

// ─── wiv.jp / okok.biz CMS ───────────────────────────────────

async function scrapeWivCms(page: Page, baseUrl: string, storeId: string) {
  const therapists: TherapistData[] = []
  const menus: MenuData[] = []

  await page.goto(`${baseUrl}/staff.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })

  const staffLinks = await page.$$eval('a[href*="staff_one"]', els =>
    els.map(e => ({ text: e.textContent?.trim() ?? '', href: (e as HTMLAnchorElement).href }))
  ).catch(() => [] as { text: string; href: string }[])
  const allImgs = await page.$$eval('img[src*="staff_"]', imgs =>
    imgs.map(i => (i as HTMLImageElement).src)
  ).catch(() => [] as string[])

  const seen = new Set<string>()
  staffLinks.forEach((link, i) => {
    const m = link.text.match(/^(.+?)\s+(\d{2})歳/)
    if (!m || seen.has(m[1])) return
    seen.add(m[1])
    therapists.push({ store_id: storeId, name: m[1].trim(), age: parseInt(m[2]), photo_url: allImgs[i] })
  })

  await page.goto(`${baseUrl}/system.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  const dtItems = await page.$$eval('dt', els => els.map(e => e.textContent?.trim() ?? '')).catch(() => [] as string[])
  const ddItems = await page.$$eval('dd', els =>
    els.map(e => e.textContent?.trim() ?? '').filter(t => t.includes('円'))
  ).catch(() => [] as string[])

  const seenMenu = new Set<string>()
  for (let i = 0; i < Math.min(dtItems.length, ddItems.length); i++) {
    const tm = dtItems[i].match(/(\d+)分/)
    const pm = ddItems[i].match(/([\d,]+)円/)
    if (!tm || !pm) continue
    const duration = parseInt(tm[1]); const price = parseInt(pm[1].replace(/,/g, ''))
    const key = `${duration}-${price}`
    if (!seenMenu.has(key) && duration >= 30 && price >= 1000) {
      seenMenu.add(key); menus.push({ store_id: storeId, name: `${duration}分コース`, duration, price })
    }
  }
  return { therapists, menus, schedules: [] as ScheduleData[] }
}

// ─── ?list_3/ CMS（A-side）───────────────────────────────────

async function scrapeListCms(page: Page, baseUrl: string, storeId: string) {
  const therapists: TherapistData[] = []
  const schedules: ScheduleData[] = []
  const today = new Date().toISOString().split('T')[0]

  await page.goto(`${baseUrl}/?list_3/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  const staffLinks = await page.$$eval('a[href*="list_3"]', els =>
    els.map(e => ({ text: e.textContent?.trim() ?? '', href: (e as HTMLAnchorElement).href }))
      .filter(l => l.href.includes('.html'))
  ).catch(() => [] as { text: string; href: string }[])

  const seen = new Set<string>()
  for (const link of staffLinks.slice(0, 50)) {
    let infoText = link.text
    let photoUrl: string | undefined

    try {
      await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 10000 })
      photoUrl = await page.$eval('img[src*="/load/image/"]', img => (img as HTMLImageElement).src).catch(() => undefined)
      if (!infoText || infoText.length < 3) {
        infoText = await page.$$eval('*', els =>
          els.map(e => e.textContent?.trim() ?? '').find(t => t.includes('歳') && t.length < 100) ?? ''
        ).catch(() => '')
      }
      const bodyText = await page.evaluate(() => document.body.textContent ?? '').catch(() => '')
      const times = parseTimes(bodyText)
      const parsed = parseName(infoText)
      if (parsed && times) {
        schedules.push({ store_id: storeId, therapist_id: '', date: today, start_time: times.start, end_time: times.end, status: 'available' })
      }
    } catch { /* skip */ }

    const parsed = parseName(infoText)
    if (!parsed || seen.has(parsed.name)) continue
    seen.add(parsed.name)
    therapists.push({
      store_id: storeId, name: parsed.name, age: parsed.age,
      height: parseHeight(infoText), bust_size: parseBust(infoText),
      photo_url: photoUrl, is_new: infoText.includes('新人') || infoText.includes('NEW'),
    })
    await page.waitForTimeout(500)
  }
  return { therapists, menus: [] as MenuData[], schedules }
}

// ─── healrelax.info / Elementor CMS ──────────────────────────

async function scrapeHealrelax(page: Page, baseUrl: string, storeId: string) {
  const therapists: TherapistData[] = []
  const menus: MenuData[] = []
  const schedules: ScheduleData[] = []
  const today = new Date().toISOString().split('T')[0]

  const staffUrl = await findLink(page, ['セラピスト', 'スタッフ', 'キャスト']) ?? `${baseUrl}/staff`
  await page.goto(staffUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

  const imgUrls = await page.$$eval('img[src*="/storage/"]', imgs =>
    imgs.map(i => (i as HTMLImageElement).src).filter(s => /\.(jpg|jpeg|png|webp)/.test(s) && !s.includes('logo'))
  ).catch(() => [] as string[])

  const textBlocks = await page.$$eval('*', els =>
    els.map(el => el.textContent?.trim() ?? '').filter(t => t.includes('歳') && t.length > 10 && t.length < 300)
  ).catch(() => [] as string[])

  const seen = new Set<string>()
  textBlocks.forEach((text, i) => {
    const ageMatches = [...text.matchAll(/([^\d\n。、！\s]{2,8}?)(\d{2})歳/g)]
    for (const match of ageMatches) {
      const name = match[1].trim().replace(/^.*?[。、]/, '').replace(/NEW|new/g, '').trim()
      if (name.length < 2 || name.length > 8 || seen.has(name)) continue
      if (/[！-～a-zA-Z]/.test(name) && name.length > 2) continue
      seen.add(name)
      const times = parseTimes(text)
      therapists.push({
        store_id: storeId, name, age: parseInt(match[2]),
        height: parseHeight(text), bust_size: parseBust(text),
        photo_url: imgUrls[therapists.length] ?? undefined,
        is_new: text.slice(0, text.indexOf(match[0])).includes('NEW') || text.includes('新人'),
      })
      if (times) schedules.push({ store_id: storeId, therapist_id: '', date: today, start_time: times.start, end_time: times.end, status: 'available' })
      break
    }
  })

  const menuUrl = await findLink(page, ['料金', 'システム', 'コース', 'メニュー']) ?? `${baseUrl}/system`
  await page.goto(menuUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
  const rawMenus = await page.$$eval('*', els =>
    els.map(e => e.textContent?.trim() ?? '').filter(t => t.includes('分') && t.includes('円') && t.length < 80)
  ).catch(() => [] as string[])
  const seenMenu = new Set<string>()
  for (const t of rawMenus) {
    const m = t.match(/(\d+)分[^\d]*([\d,]+)円/)
    if (!m) continue
    const duration = parseInt(m[1]); const price = parseInt(m[2].replace(/,/g, ''))
    const key = `${duration}-${price}`
    if (!seenMenu.has(key) && duration >= 30 && price >= 1000) {
      seenMenu.add(key); menus.push({ store_id: storeId, name: `${duration}分コース`, duration, price })
    }
  }
  return { therapists, menus, schedules }
}

// ─── 汎用スクレイパー（WordPress・独自CMS） ──────────────────

async function scrapeGeneric(page: Page, baseUrl: string, storeId: string) {
  const therapists: TherapistData[] = []
  const menus: MenuData[] = []
  const schedules: ScheduleData[] = []
  const today = new Date().toISOString().split('T')[0]

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

  // スタッフページ
  const staffUrl = await findLink(page, ['キャスト', 'セラピスト', 'スタッフ', 'CAST', 'STAFF', '在籍', '女の子'])
    ?? `${baseUrl}/staff.php`
  try {
    await page.goto(staffUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(800)

    // 画像付きブロックからセラピスト情報取得
    const blocks = await page.$$eval('*', els =>
      els.map(el => ({
        text: el.textContent?.trim() ?? '',
        imgs: Array.from(el.querySelectorAll('img')).map(i => (i as HTMLImageElement).src)
          .filter(s => !s.includes('logo') && !s.includes('icon') && !s.includes('banner') && !s.includes('spacer')),
      })).filter(b => b.text.includes('歳') && b.text.length < 300 && b.imgs.length >= 1 && b.imgs.length <= 3)
    ).catch(() => [] as { text: string; imgs: string[] }[])

    const seen = new Set<string>()
    for (const b of blocks) {
      const parsed = parseName(b.text)
      if (!parsed || seen.has(parsed.name)) continue
      seen.add(parsed.name)
      therapists.push({
        store_id: storeId, name: parsed.name, age: parsed.age,
        height: parseHeight(b.text), bust_size: parseBust(b.text),
        photo_url: b.imgs[0],
        is_new: b.text.includes('新人') || b.text.includes('NEW'),
      })
    }

    // トップページのスケジュールリンク（WordPress型）
    if (staffUrl.includes('cast') || staffUrl.includes('staff')) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      const schedLinks = await page.$$eval('a', els =>
        els.map(e => ({ text: e.textContent?.trim() ?? '', href: (e as HTMLAnchorElement).href }))
          .filter(l => /\d{1,2}:\d{2}/.test(l.text) && l.href.startsWith('http'))
      ).catch(() => [] as { text: string; href: string }[])

      const seenSched = new Set<string>()
      for (const l of schedLinks) {
        const times = parseTimes(l.text)
        const nameMatch = l.text.match(/^([^\s\d]{2,8})/)
        if (!times || !nameMatch) continue
        const name = nameMatch[1].trim()
        const key = `${name}-${times.start}`
        if (!seenSched.has(key)) {
          seenSched.add(key)
          schedules.push({ store_id: storeId, therapist_id: '', date: today, start_time: times.start, end_time: times.end, status: 'available' })
        }
      }

      // スケジュールページ
      if (schedules.length === 0) {
        const schedUrl = await findLink(page, ['出勤', 'スケジュール', 'SCHEDULE', '本日'])
        if (schedUrl) {
          await page.goto(schedUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
          const schedBlocks = await page.$$eval('*', els =>
            els.map(e => e.textContent?.trim() ?? '').filter(t => t.includes('歳') && /\d{1,2}:\d{2}/.test(t) && t.length < 200)
          ).catch(() => [] as string[])
          const seenSched2 = new Set<string>()
          for (const b of schedBlocks) {
            const times = parseTimes(b)
            const parsed = parseName(b)
            if (!times || !parsed) continue
            const key = `${parsed.name}-${times.start}`
            if (!seenSched2.has(key)) {
              seenSched2.add(key)
              schedules.push({ store_id: storeId, therapist_id: '', date: today, start_time: times.start, end_time: times.end, status: 'available' })
            }
          }
        }
      }
    }
  } catch { /* skip */ }

  // 料金ページ
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    const menuUrl = await findLink(page, ['料金', 'システム', 'コース', 'メニュー', 'MENU', 'PRICE', 'SYSTEM'])
      ?? `${baseUrl}/system.php`
    await page.goto(menuUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const rawMenus = await page.$$eval('*', els =>
      els.map(e => e.textContent?.trim() ?? '')
        .filter(t => (t.includes('分') || t.includes('min')) && (t.includes('円') || t.includes(',000')) && t.length < 100)
    ).catch(() => [] as string[])

    const seenMenu = new Set<string>()
    for (const t of rawMenus) {
      const m = t.match(/(\d+)(分|min)[^\d]*([\d,]+)円?/)
      if (!m) continue
      const duration = parseInt(m[1]); const price = parseInt(m[3].replace(/,/g, ''))
      const key = `${duration}-${price}`
      if (!seenMenu.has(key) && duration >= 30 && duration <= 300 && price >= 1000) {
        seenMenu.add(key); menus.push({ store_id: storeId, name: `${duration}分コース`, duration, price })
      }
    }
  } catch { /* skip */ }

  return { therapists, menus, schedules }
}

// ─── メイン ───────────────────────────────────────────────────

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
  const today = new Date().toISOString().split('T')[0]

  for (const store of stores) {
    console.log(`\n[${store.name}] ${store.official_url}`)
    try {
      const baseUrl = store.official_url!.replace(/\/$/, '').replace(/\/index\.html?$/, '')
      const cms = detectCms(baseUrl)
      console.log(`  CMS: ${cms}`)

      let result: { therapists: TherapistData[]; menus: MenuData[]; schedules: ScheduleData[] }

      if (cms === 'wiv') {
        result = await scrapeWivCms(page, baseUrl, store.id)
      } else if (cms === 'listcms') {
        result = await scrapeListCms(page, baseUrl, store.id)
      } else if (cms === 'healrelax') {
        result = await scrapeHealrelax(page, baseUrl, store.id)
      } else {
        result = await scrapeGeneric(page, baseUrl, store.id)
      }

      console.log(`  セラピスト: ${result.therapists.length}名 / メニュー: ${result.menus.length}件 / スケジュール: ${result.schedules.length}件`)

      // セラピスト保存
      const therapistMap = new Map<string, string>()
      for (const t of result.therapists) {
        const { data: existing } = await supabase.from('therapists').select('id').eq('store_id', store.id).eq('name', t.name).single()
        if (existing) {
          await supabase.from('therapists').update({ age: t.age, height: t.height, bust_size: t.bust_size, photo_url: t.photo_url, is_new: t.is_new }).eq('id', existing.id)
          therapistMap.set(t.name, existing.id)
        } else {
          const { data: inserted } = await supabase.from('therapists').insert(t).select('id').single()
          if (inserted) therapistMap.set(t.name, inserted.id)
        }
      }

      // メニュー保存
      for (const m of result.menus) {
        const { data: existing } = await supabase.from('menus').select('id').eq('store_id', store.id).eq('duration', m.duration).single()
        if (!existing) await supabase.from('menus').insert(m)
      }

      // スケジュール保存（セラピストIDを名前でマッチング）
      for (const s of result.schedules) {
        let therapistId = s.therapist_id
        if (!therapistId) {
          // スケジュールの名前からIDを探す（汎用スクレイパーはtherapist_idが空）
          const matchedId = [...therapistMap.entries()].find(([name]) => s.store_id === store.id && name)?.[1]
          if (!matchedId) continue
          therapistId = matchedId
        }
        if (s.start_time && s.end_time) {
          await supabase.from('schedules').upsert({
            store_id: store.id, therapist_id: therapistId,
            date: today, start_time: s.start_time, end_time: s.end_time, status: 'available'
          }, { onConflict: 'therapist_id,date' })
        }
      }

      await page.waitForTimeout(1200)
    } catch (err) {
      console.error(`  エラー: ${err}`)
    }
  }

  await browser.close()
  console.log('\n=== 全店舗の処理完了 ===')
}
