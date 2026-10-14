import type { CharState, MarkType, Syllable, ToneType } from './types'

const VOWELS = 'aăâeêioôơuưy'

const MARK_MAP: Record<string, MarkType> = {
  '\u0302': 'circumflex',
  '\u0306': 'breve',
  '\u031B': 'horn',
}

const TONE_MAP: Record<string, ToneType> = {
  '\u0301': 'acute',
  '\u0300': 'grave',
  '\u0309': 'hook',
  '\u0303': 'tilde',
  '\u0323': 'dot',
}

export const TONE_KEY_OF: Record<ToneType, string> = {
  acute: 's',
  grave: 'f',
  hook: 'r',
  tilde: 'x',
  dot: 'j',
}

export const TONE_TYPE_OF: Record<string, ToneType> = {
  s: 'acute',
  f: 'grave',
  r: 'hook',
  x: 'tilde',
  j: 'dot',
}

/**
 * 解析单个字符
 * [边界 2] 内部解析：NFD 拆分 base + marks + tone
 */
function parseChar(char: string): CharState {
  if (char === ' ') {
    return { base: ' ', marks: [], tone: null, isUpper: false, isSpace: true }
  }

  // đ / Đ：无 NFD 组合分解，直接识别
  if (char === 'đ' || char === 'Đ') {
    return { base: 'd', marks: ['stroke'], tone: null, isUpper: char === 'Đ', isSpace: false }
  }

  const nfd = char.normalize('NFD')
  const baseChar = nfd[0]
  const combiningMarks = nfd.slice(1)

  const isUpper = baseChar !== baseChar.toLowerCase()
  const base = baseChar.toLowerCase()

  const marks: MarkType[] = []
  let tone: ToneType | null = null

  for (const m of combiningMarks) {
    if (MARK_MAP[m]) marks.push(MARK_MAP[m])
    if (TONE_MAP[m]) tone = TONE_MAP[m]
  }

  return { base, marks, tone, isUpper, isSpace: false }
}

/**
 * 找音节主元音
 * 优先级：带声调 > 带变音 > 倒数第二个元音
 */
function findMainVowel(chars: CharState[]): number {
  const vowelIndices: number[] = []
  for (let i = 0; i < chars.length; i++) {
    if (VOWELS.includes(chars[i].base)) vowelIndices.push(i)
  }
  if (vowelIndices.length === 0) return -1
  if (vowelIndices.length === 1) return vowelIndices[0]

  for (const idx of vowelIndices) if (chars[idx].tone) return idx
  for (const idx of vowelIndices) if (chars[idx].marks.length > 0) return idx
  return vowelIndices[vowelIndices.length - 2]
}

function buildSyllable(chars: CharState[]): Syllable {
  const mainVowelIndex = findMainVowel(chars)
  const tone = mainVowelIndex >= 0 ? chars[mainVowelIndex].tone : null
  return {
    chars,
    mainVowelIndex,
    toneKey: tone ? TONE_KEY_OF[tone] : null,
  }
}

/**
 * 越南语单词 → 音节数组
 * [边界 1] 入口统一 NFC
 */
export function parseVietnamese(word: string): Syllable[] {
  const nfcWord = word.normalize('NFC')
  const chars = Array.from(nfcWord).map(parseChar)

  const syllables: Syllable[] = []
  let current: CharState[] = []

  for (const c of chars) {
    if (c.isSpace) {
      if (current.length > 0) {
        syllables.push(buildSyllable(current))
        current = []
      }
      syllables.push({ chars: [c], mainVowelIndex: -1, toneKey: null })
    } else {
      current.push(c)
    }
  }
  if (current.length > 0) syllables.push(buildSyllable(current))

  return syllables
}

export function markToKey(base: string, mark: MarkType): string | null {
  switch (mark) {
    case 'circumflex':
      if (base === 'a' || base === 'e' || base === 'o') return base
      return null
    case 'breve':
      if (base === 'a') return 'w'
      return null
    case 'horn':
      if (base === 'o' || base === 'u') return 'w'
      return null
    case 'stroke':
      if (base === 'd') return 'd'
      return null
  }
}
