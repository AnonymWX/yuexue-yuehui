// 日语假名分组（按行）
// 平假名 / 浊音 / 片假名 三块
// 片假名 key 加 k_ 前缀，避免与平假名组名冲突

export const HIRAGANA_BASIC: Record<string, string[]> = {
  a: ['あ', 'い', 'う', 'え', 'お'],
  ka: ['か', 'き', 'く', 'け', 'こ'],
  sa: ['さ', 'し', 'す', 'せ', 'そ'],
  ta: ['た', 'ち', 'つ', 'て', 'と'],
  na: ['な', 'に', 'ぬ', 'ね', 'の'],
  ha: ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ma: ['ま', 'み', 'む', 'め', 'も'],
  ya: ['や', 'ゆ', 'よ'],
  ra: ['ら', 'り', 'る', 'れ', 'ろ'],
  wa: ['わ', 'を', 'ん'],
}

export const HIRAGANA_DAKUON: Record<string, string[]> = {
  ga: ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  za: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  da: ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ba: ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  pa: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
}

export const KATAKANA_BASIC: Record<string, string[]> = {
  k_a: ['ア', 'イ', 'ウ', 'エ', 'オ'],
  k_ka: ['カ', 'キ', 'ク', 'ケ', 'コ'],
  k_sa: ['サ', 'シ', 'ス', 'セ', 'ソ'],
  k_ta: ['タ', 'チ', 'ツ', 'テ', 'ト'],
  k_na: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  k_ha: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  k_ma: ['マ', 'ミ', 'ム', 'メ', 'モ'],
  k_ya: ['ヤ', 'ユ', 'ヨ'],
  k_ra: ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  k_wa: ['ワ', 'ヲ', 'ン'],
}

export const KANA_GROUP_ORDER = [...Object.keys(HIRAGANA_BASIC), ...Object.keys(HIRAGANA_DAKUON), ...Object.keys(KATAKANA_BASIC)]

export const KANA_CHAR_MAP: Record<string, string[]> = {
  ...HIRAGANA_BASIC,
  ...HIRAGANA_DAKUON,
  ...KATAKANA_BASIC,
}
