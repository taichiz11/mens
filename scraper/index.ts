import 'dotenv/config'
import { scrapeEstheRankingMusashikosugi, importScrapedStores } from './sites/esthe-ranking'
import { scrapeOfficialSites } from './sites/official-site'

const command = process.argv[2] // 'scrape' | 'import' | 'scrape-official'

async function main() {
  if (command === 'import') {
    console.log('=== Supabaseへのインポート開始 ===\n')
    await importScrapedStores()
    return
  }

  if (command === 'scrape-official') {
    console.log('=== 公式サイト スクレイピング開始 ===\n')
    await scrapeOfficialSites()
    return
  }

  console.log('=== スクレイピング開始 ===\n')
  await scrapeEstheRankingMusashikosugi()
  console.log('\n完了。確認後 `npm run import` でSupabaseに取り込めます。')
}

main()
