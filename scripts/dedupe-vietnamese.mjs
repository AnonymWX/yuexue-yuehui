import fs from 'node:fs'
import path from 'node:path'

const dictsDir = path.resolve('public/dicts')
const files = fs.readdirSync(dictsDir).filter((f) => f.endsWith('.json') && f.startsWith('vietnamese_'))

for (const file of files) {
  const filePath = path.join(dictsDir, file)
  const raw = fs.readFileSync(filePath, 'utf-8')

  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.log(`❌ ${file}: JSON 解析失败，跳过`)
    continue
  }

  if (!Array.isArray(data)) continue

  const seenIds = new Set()
  const seenNames = new Set()
  const result = []
  let removed = 0

  for (const item of data) {
    // id 重复 → 跳过
    if (item.id && seenIds.has(item.id)) {
      removed++
      console.log(`  🗑️  ${file}: 删除重复 id: ${item.id} (name: ${item.name})`)
      continue
    }
    // name 重复 → 跳过
    if (item.name && seenNames.has(item.name)) {
      removed++
      console.log(`  🗑️  ${file}: 删除重复 name: "${item.name}" (id: ${item.id})`)
      continue
    }

    if (item.id) seenIds.add(item.id)
    if (item.name) seenNames.add(item.name)
    result.push(item)
  }

  if (removed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8')
    console.log(`✅ ${file}: ${data.length} → ${result.length} (删除 ${removed} 条)\n`)
  } else {
    console.log(`✅ ${file}: 无重复，保持 ${data.length} 条\n`)
  }
}

console.log('完成')
