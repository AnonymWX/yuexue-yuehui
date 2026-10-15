// scripts/fix-health-sentences.mjs
// 把 A2 health 的 48 条句子 course 引用从 101~106 挪到 105~110
// 只改 id 以 "sentence_vi_a2_" 开头的条目（health / weather / travel 等 A2 句）
// 不改 A1 的 sentence_vi_XXX（hobbies 的 101~104 不动）
// 用法：node scripts/fix-health-sentences.mjs
import fs from 'node:fs'
import path from 'node:path'

const FILE = path.resolve('src/sentences/vietnamese_sentences.json')

const MAP = {
  course_vi_101: 'course_vi_105',
  course_vi_102: 'course_vi_106',
  course_vi_103: 'course_vi_107',
  course_vi_104: 'course_vi_108',
  course_vi_105: 'course_vi_109',
  course_vi_106: 'course_vi_110',
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
if (!Array.isArray(data)) {
  console.error('文件格式异常：顶层不是数组')
  process.exit(1)
}

let count = 0
for (const s of data) {
  // 只动 A2 的句子（sentence_vi_a2_ 前缀）
  if (typeof s.id === 'string' && s.id.startsWith('sentence_vi_a2_') && MAP[s.course]) {
    console.log(`${s.id}: ${s.course} → ${MAP[s.course]}`)
    s.course = MAP[s.course]
    count++
  }
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 4) + '\n', 'utf8')
console.log(`\n✅ 共替换 ${count} 处`)
