import { parseVietnamese } from './parse'
import type { ToneType } from './types'

const MARK_KEY: Record<string, string | null> = {
  // 变音键映射
}

const TONE_KEY: Record<ToneType, string> = {
  acute: 's',
  grave: 'f',
  hook: 'r',
  tilde: 'x',
  dot: 'j',
}

/**
 * 单字符 → 主 Telex 按键序列
 * 例：'ế' → 'ees'
 *     'ừ' → 'uwf'
 *     'đ' → 'dd'
 *     'a' → 'a'
 */
export function charToTelex(char: string): string {
  const syllables = parseVietnamese(char)
  if (syllables.length === 0) return ''
  const syl = syllables[0]
  if (syl.chars.length === 0) return ''

  const c = syl.chars[0]
  let result = ''

  // 1. 基础键
  const baseKey = c.isUpper ? c.base.toUpperCase() : c.base
  result += baseKey

  // 2. 变音键（按 Telex 规则）
  for (const m of c.marks) {
    if (m === 'circumflex' && (c.base === 'a' || c.base === 'e' || c.base === 'o')) {
      result += c.base
    } else if (m === 'breve' && c.base === 'a') {
      result += 'w'
    } else if (m === 'horn' && (c.base === 'o' || c.base === 'u')) {
      result += 'w'
    } else if (m === 'stroke' && c.base === 'd') {
      result += 'd'
    }
  }

  // 3. 声调键
  if (c.tone) {
    result += TONE_KEY[c.tone]
  }

  return result
}

/**
 * 所有合法按键序列（用于判定"是否可能是前缀"）
 * 目前单字符只有一条主序列
 */
export function charToTelexAll(char: string): string[] {
  return [charToTelex(char)]
}
