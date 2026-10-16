// 韩语韩字分组（按 KS X 5002 2-beolsik）

export const HANGUL_CONSONANTS: Record<string, string[]> = {
  basic: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
  double: ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'],
}

export const HANGUL_VOWELS: Record<string, string[]> = {
  basic: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
  compound: ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'],
}

export const HANGUL_BATCHIM: Record<string, string[]> = {
  batchim: ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'],
}

export const HANGUL_GROUP_ORDER = ['consonant_basic', 'vowel_basic', 'vowel_compound', 'consonant_double', 'batchim']

export const HANGUL_CHAR_MAP: Record<string, string[]> = {
  consonant_basic: HANGUL_CONSONANTS.basic,
  vowel_basic: HANGUL_VOWELS.basic,
  vowel_compound: HANGUL_VOWELS.compound,
  consonant_double: HANGUL_CONSONANTS.double,
  batchim: HANGUL_BATCHIM.batchim,
}
