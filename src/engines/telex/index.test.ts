import { createTelexEngine } from './index'
import { describe, it, expect } from 'vitest'

function typeSequence(targetWord: string, keys: string) {
  const engine = createTelexEngine(targetWord)
  let display = ''
  for (const ch of keys) {
    const res = engine.feed(ch)
    display = res.display
  }
  return display
}

describe('Telex 输入引擎', () => {
  it('基础字母序列（无音调）', () => {
    expect(typeSequence('toi', 'toi')).toBe('toi')
  })
  it('基础字母序列（含辅音结尾）', () => {
    expect(typeSequence('ban', 'ban')).toBe('ban')
  })
  it('锐声 s（cá）', () => {
    expect(typeSequence('cá', 'cas')).toBe('cá')
  })
  it('玄声 f（cà）', () => {
    expect(typeSequence('cà', 'caf')).toBe('cà')
  })
  it('问声 r（cả）', () => {
    expect(typeSequence('cả', 'car')).toBe('cả')
  })
  it('跌声 x（cã）', () => {
    expect(typeSequence('cã', 'cax')).toBe('cã')
  })
  it('重声 j（cạ）', () => {
    expect(typeSequence('cạ', 'caj')).toBe('cạ')
  })
  it('非法输入返回 reject', () => {
    const engine = createTelexEngine('a')
    const res = engine.feed('z')
    expect(res.status).toBe('reject')
  })
  it('backspace 回退', () => {
    const engine = createTelexEngine('toi')
    engine.feed('t')
    engine.feed('o')
    engine.backspace()
    expect(engine.getDisplay()).toBe('t')
  })
})
