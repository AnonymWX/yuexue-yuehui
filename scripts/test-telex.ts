import { createTelexEngine } from '../src/engines/telex'

console.log('=== 1. 按键序列（主序列） ===')
const words = ['xin chào', 'tạm biệt', 'cảm ơn', 'đường', 'Việt Nam']
for (const w of words) {
  const engine = createTelexEngine(w)
  const all = (engine as any).getAllExpectedKeys?.() ?? [engine.getExpectedKeys()]
  console.log(`"${w}" → 主: "${engine.getExpectedKeys()}" | 全部: ${all.map((k: string) => `"${k}"`).join(', ')}`)
}

console.log('\n=== 2. xin chào 两种声调位置都能通过 ===')
for (const input of ['xin chaof', 'xin chafo']) {
  const engine = createTelexEngine('xin chào')
  let lastStatus = ''
  for (const k of input) {
    const r = engine.feed(k)
    lastStatus = r.status
  }
  console.log(`  "${input}" → ${lastStatus} ${lastStatus === 'accept' ? '✅' : '❌'}`)
}

console.log('\n=== 3. cảm ơn 两种声调位置都能通过 ===')
for (const input of ['camr own', 'carm own']) {
  const engine = createTelexEngine('cảm ơn')
  let lastStatus = ''
  for (const k of input) {
    const r = engine.feed(k)
    lastStatus = r.status
  }
  console.log(`  "${input}" → ${lastStatus} ${lastStatus === 'accept' ? '✅' : '❌'}`)
}

console.log('\n=== 4. 非法序列应该 reject ===')
{
  const engine = createTelexEngine('cảm ơn')
  const badKeys = 'carm orn'
  let rejected = false
  for (const k of badKeys) {
    const r = engine.feed(k)
    if (r.status === 'reject') {
      console.log(`  "${badKeys}" 在 "${k}" 处 reject ✅`)
      rejected = true
      break
    }
  }
  if (!rejected) console.log(`  "${badKeys}" 未 reject ❌`)
}

console.log('\n=== 5. tạm biệt 完整输入 ===')
{
  const engine = createTelexEngine('tạm biệt')
  console.log(`  keys: "${engine.getExpectedKeys()}"`)
  const input = 'tamj bieetj'
  for (const k of input) {
    const r = engine.feed(k)
    console.log(`  "${k}" → ${r.status} | "${r.display}"`)
  }
}

console.log('\n=== 6. 退格 ===')
{
  const engine = createTelexEngine('xin chào')
  for (const k of 'xin') engine.feed(k)
  console.log(`  输入 xin → "${engine.getDisplay()}"`)
  engine.backspace()
  console.log(`  退格一次 → "${engine.getDisplay()}"`)
  engine.backspace()
  console.log(`  退格两次 → "${engine.getDisplay()}"`)
}

console.log('\n=== 7. 中途显示进度 ===')
{
  const engine = createTelexEngine('tạm biệt')
  for (const k of 'tamj bieetj') {
    const r = engine.feed(k)
    console.log(`  "${k}" → "${r.display}"`)
  }
}
