import fs from 'node:fs'
import path from 'node:path'

const dictsDir = path.resolve('public/dicts')
const dictionaryTsPath = path.resolve('src/resources/dictionary.ts')

/**
 * 只更新这个列表里的词典
 * 留空数组表示处理全部
 */
const ONLY_FILES: string[] = [
  'vietnamese_basic.json',
  // 以后加更多越南语词典，在这里加文件名
]

let content = fs.readFileSync(dictionaryTsPath, 'utf-8')
const files = fs.readdirSync(dictsDir).filter((f) => f.endsWith('.json'))

const targetFiles = ONLY_FILES.length > 0 ? files.filter((f) => ONLY_FILES.includes(f)) : files

let updated = 0
let unchanged = 0

for (const file of targetFiles) {
  const url = `/dicts/${file}`
  const data = JSON.parse(fs.readFileSync(path.join(dictsDir, file), 'utf-8'))
  const length = Array.isArray(data) ? data.length : 0

  const urlEscaped = url.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(url:\\s*['"]${urlEscaped}['"][\\s\\S]*?length:\\s*)(\\d+)`, 'g')

  content = content.replace(regex, (_match, prefix, oldLength) => {
    if (Number(oldLength) === length) {
      unchanged++
      return `${prefix}${length}`
    }
    updated++
    console.log(`  ${file}: ${oldLength} → ${length}`)
    return `${prefix}${length}`
  })
}

fs.writeFileSync(dictionaryTsPath, content, 'utf-8')
console.log(`\n✅ 完成：更新 ${updated} 个，未变 ${unchanged} 个`)
