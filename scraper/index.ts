import 'dotenv/config'
import { scrapeHotpepper } from './sites/hotpepper'

async function main() {
  console.log('=== スクレイピング開始 ===')
  const stores = await scrapeHotpepper()

  console.log('\n=== 取得結果 ===')
  stores.forEach((s, i) => {
    console.log(`\n[${i + 1}] ${s.name}`)
    if (s.address) console.log(`    住所: ${s.address}`)
    if (s.nearest_station) console.log(`    アクセス: ${s.nearest_station}`)
    if (s.rating) console.log(`    評価: ${s.rating} (${s.review_count}件)`)
  })

  console.log('\n=== 完了 ===')
  console.log('結果はSupabaseのscrape_logsテーブルに保存されました。')
  console.log('内容を確認後、stores/review_summariesテーブルに手動で反映してください。')
}

main()
