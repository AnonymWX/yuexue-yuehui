// 韩字 → 2-beolsik 键位（KS X 5002 标准）
// 辅音在左，元音在右；紧音 = Shift + 基本辅音

/** 单字母 → 键位 */
const HANGUL_TO_KEY: Record<string, string> = {
  // ===== 辅音（左手）=====
  ㄱ: 'r',
  ㄲ: 'R',
  ㄴ: 's',
  ㄷ: 'e',
  ㄸ: 'E',
  ㄹ: 'f',
  ㅁ: 'a',
  ㅂ: 'q',
  ㅃ: 'Q',
  ㅅ: 't',
  ㅆ: 'T',
  ㅇ: 'd',
  ㅈ: 'w',
  ㅉ: 'W',
  ㅊ: 'c',
  ㅋ: 'z',
  ㅌ: 'x',
  ㅍ: 'v',
  ㅎ: 'g',

  // ===== 元音（右手）=====
  ㅏ: 'k',
  ㅑ: 'i',
  ㅓ: 'j',
  ㅕ: 'u',
  ㅗ: 'h',
  ㅛ: 'y',
  ㅜ: 'n',
  ㅠ: 'b',
  ㅡ: 'm',
  ㅣ: 'l',
  ㅐ: 'o',
  ㅒ: 'O',
  ㅔ: 'p',
  ㅖ: 'P',
  ㅘ: 'hk',
  ㅙ: 'ho',
  ㅚ: 'hl',
  ㅝ: 'nj',
  ㅞ: 'np',
  ㅟ: 'nl',
  ㅢ: 'ml',
}

/**
 * 单韩字 → 2-beolsik 键位序列
 * 例：'ㄱ' → 'r'，'ㅏ' → 'k'，'한' → 'gks'
 */
export function charTo2beolsik(char: string): string {
  if (!char) return ''

  const code = char.charCodeAt(0)

  // 1. 单字母（兼容区 U+3131~U+3163）—— 辅音 / 元音
  if (code >= 0x3131 && code <= 0x3163) {
    return HANGUL_TO_KEY[char] ?? ''
  }

  // 2. 音节（U+AC00~U+D7A3）
  if (code < 0xac00 || code > 0xd7a3) return ''

  const offset = code - 0xac00
  const choIdx = Math.floor(offset / (21 * 28))
  const jungIdx = Math.floor((offset % (21 * 28)) / 28)
  const jongIdx = offset % 28

  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
  const JUNG = [
    'ㅏ',
    'ㅐ',
    'ㅑ',
    'ㅒ',
    'ㅓ',
    'ㅔ',
    'ㅕ',
    'ㅖ',
    'ㅗ',
    'ㅘ',
    'ㅙ',
    'ㅚ',
    'ㅛ',
    'ㅜ',
    'ㅝ',
    'ㅞ',
    'ㅟ',
    'ㅠ',
    'ㅡ',
    'ㅢ',
    'ㅣ',
  ]
  const JONG = [
    '',
    'ㄱ',
    'ㄲ',
    'ㄳ',
    'ㄴ',
    'ㄵ',
    'ㄶ',
    'ㄷ',
    'ㄹ',
    'ㄺ',
    'ㄻ',
    'ㄼ',
    'ㄽ',
    'ㄾ',
    'ㄿ',
    'ㅀ',
    'ㅁ',
    'ㅂ',
    'ㅄ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ]

  let result = ''
  result += HANGUL_TO_KEY[CHO[choIdx]] ?? ''
  result += HANGUL_TO_KEY[JUNG[jungIdx]] ?? ''
  if (jongIdx > 0) {
    result += HANGUL_TO_KEY[JONG[jongIdx]] ?? ''
  }

  return result
}

/**
 * 所有合法键位序列（目前单入口）
 */
export function charTo2beolsikAll(char: string): string[] {
  return [charTo2beolsik(char)]
}

/**
 * 判断当前输入是否是某韩字的合法前缀
 */
export function isBeolsikPrefix(input: string, char: string): boolean {
  const expected = charTo2beolsik(char)
  return expected.toLowerCase().startsWith(input.toLowerCase())
}
