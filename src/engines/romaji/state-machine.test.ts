import { createRomajiEngine } from './state-machine'
import { describe, it, expect } from 'vitest'

function typeKeys(keys: string) {
  const engine = createRomajiEngine()
  let display = ''
  for (const ch of keys) {
    const res = engine.feed(ch)
    display = res.display
  }
  return display
}

describe('Romaji 输入引擎', () => {
  it('单一母音 a → あ', () => expect(typeKeys('a')).toBe('あ'))
  it('清音 ka → か', () => expect(typeKeys('ka')).toBe('か'))
  it('浊音 ga → が', () => expect(typeKeys('ga')).toBe('が'))
  it('半浊音 pa → ぱ', () => expect(typeKeys('pa')).toBe('ぱ'))
  it('拗音 kya → きゃ', () => expect(typeKeys('kya')).toBe('きゃ'))
  it('训令式 si 与 ヘボン式 shi 都映射到 し', () => {
    expect(typeKeys('si')).toBe('し')
    expect(typeKeys('shi')).toBe('し')
  })
  it('促音 kka → っか', () => expect(typeKeys('kka')).toBe('っか'))
  it('拨音 nn → ん', () => expect(typeKeys('nn')).toBe('ん'))
  it("拨音 n' → ん", () => expect(typeKeys("n'")).toBe('ん'))
  it('小写假名 xtu → っ', () => expect(typeKeys('xtu')).toBe('っ'))
  it('非字母输入应 reject', () => {
    const engine = createRomajiEngine()
    const res = engine.feed('1')
    expect(res.status).toBe('reject')
  })
})
