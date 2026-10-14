import fs from 'node:fs'
import path from 'node:path'

const dictsDir = path.resolve('public/dicts')

// 只检查越南语词典
const files = fs.readdirSync(dictsDir).filter((f) => f.endsWith('.json') && f.startsWith('vietnamese_'))

if (files.length === 0) {
  console.log('没有找到 vietnamese_ 开头的词典文件')
  process.exit(0)
}

for (const file of files) {
  const filePath = path.join(dictsDir, file)
  const raw = fs.readFileSync(filePath, 'utf-8')

  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.log(`❌ ${file}: JSON 解析失败`)
    continue
  }

  if (!Array.isArray(data)) continue

  const idCount = new Map()
  const nameCount = new Map()
  const idsWithIndex = new Map()

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (item.id) {
      idCount.set(item.id, (idCount.get(item.id) ?? 0) + 1)
      if (!idsWithIndex.has(item.id)) idsWithIndex.set(item.id, [])
      idsWithIndex.get(item.id).push(i)
    }
    if (item.name) nameCount.set(item.name, (nameCount.get(item.name) ?? 0) + 1)
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1)
  const dupNames = [...nameCount.entries()].filter(([, c]) => c > 1)

  console.log(`\n📄 ${file}`)
  console.log(`  总条目: ${data.length}`)

  if (dupIds.length === 0 && dupNames.length === 0) {
    console.log(`  ✅ 无重复`)
    continue
  }

  if (dupIds.length > 0) {
    console.log(`  ⚠️ 重复 id: ${dupIds.length} 个`)
    dupIds.slice(0, 20).forEach(([id, c]) => {
      const indices = idsWithIndex.get(id) || []
      console.log(`     ${id} × ${c} (位置: ${indices.join(', ')})`)
    })
    if (dupIds.length > 20) console.log(`     ... 还有 ${dupIds.length - 20} 个`)
  }

  if (dupNames.length > 0) {
    console.log(`  ⚠️ 重复 name: ${dupNames.length} 个`)
    dupNames.slice(0, 20).forEach(([n, c]) => console.log(`     "${n}" × ${c}`))
    if (dupNames.length > 20) console.log(`     ... 还有 ${dupNames.length - 20} 个`)
  }
}
