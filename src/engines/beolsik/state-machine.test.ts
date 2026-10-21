import { createBeolsikEngine } from './state-machine'
import { describe, it, expect } from 'vitest'

function typeKeys(keys: string) {
  const engine = createBeolsikEngine()
  let display = ''
  for (const ch of keys) {
    const res = engine.feed(ch)
    display = res.display
  }
  return display
}

describe('2-beolsik 输入引擎', () => {
  it('r + k → 가（ㄱ + ㅏ）', () => expect(typeKeys('rk')).toBe('가'))
  it('d + k → 아（元音起头补 ㅇ）', () => expect(typeKeys('dk')).toBe('아'))
  it('r + h + k → 과（ㄱ + ㅘ）', () => expect(typeKeys('rhk')).toBe('과'))
  it('r + k + s → 간（ㄱ + ㅏ + ㄴ）', () => expect(typeKeys('rks')).toBe('간'))
  it('大写 R + k → 까（紧音 ㄲ）', () => expect(typeKeys('Rk')).toBe('까'))
  it('复合元音 d + n + j → 워', () => expect(typeKeys('dnj')).toBe('워'))
  it('终声迁移 rksk → 가나', () => expect(typeKeys('rksk')).toBe('가나'))
  it('复合终声 rkrt → 갃', () => expect(typeKeys('rkrt')).toBe('갃'))
  it('非字母输入应 reject', () => {
    const engine = createBeolsikEngine()
    const res = engine.feed('1')
    expect(res.status).toBe('reject')
  })
})
