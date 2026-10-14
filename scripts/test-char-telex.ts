import { charToTelex } from '../src/engines/telex/char-telex'
import { TONE_DRILL_CHARS, CHAR_DRILL_CHARS } from '../src/engines/telex/characters'

console.log('=== 声调专项测试（前 12 个） ===')
for (const c of TONE_DRILL_CHARS.slice(0, 12)) {
  console.log(`  "${c}" → "${charToTelex(c)}"`)
}

console.log('\n=== 关键字符测试 ===')
const cases = ['ế', 'ừ', 'đ', 'ơ', 'ư', 'ă', 'â', 'ô', 'ê', 'a', 'A', 'Đ']
for (const c of cases) {
  console.log(`  "${c}" → "${charToTelex(c)}"`)
}

console.log('\n=== 完整字符池检查 ===')
let failCount = 0
for (const c of CHAR_DRILL_CHARS) {
  const telex = charToTelex(c)
  if (!telex) {
    console.log(`  ❌ "${c}" 无转换结果`)
    failCount++
  }
}
if (failCount === 0) {
  console.log(`  ✅ 全部 ${CHAR_DRILL_CHARS.length} 个字符都有转换结果`)
} else {
  console.log(`  ❌ 有 ${failCount} 个字符转换失败`)
}
