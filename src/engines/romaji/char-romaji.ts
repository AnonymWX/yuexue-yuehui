// 假名 → 罗马字输入序列
// 支持：训令式 + ヘボン式（多入口）
// 促音、拨音按官方规则

/** 主表：假名 → 主输入序列（训令式优先） */
const KANA_TO_ROMAJI: Record<string, string> = {
  // ===== 五十音（训令式 / ヘボン式）=====
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  を: 'wo',
  ん: 'nn',

  // ===== 浊音 =====
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',

  // ===== 片假名 =====
  ア: 'a',
  イ: 'i',
  ウ: 'u',
  エ: 'e',
  オ: 'o',
  カ: 'ka',
  キ: 'ki',
  ク: 'ku',
  ケ: 'ke',
  コ: 'ko',
  サ: 'sa',
  シ: 'shi',
  ス: 'su',
  セ: 'se',
  ソ: 'so',
  タ: 'ta',
  チ: 'chi',
  ツ: 'tsu',
  テ: 'te',
  ト: 'to',
  ナ: 'na',
  ニ: 'ni',
  ヌ: 'nu',
  ネ: 'ne',
  ノ: 'no',
  ハ: 'ha',
  ヒ: 'hi',
  フ: 'fu',
  ヘ: 'he',
  ホ: 'ho',
  マ: 'ma',
  ミ: 'mi',
  ム: 'mu',
  メ: 'me',
  モ: 'mo',
  ヤ: 'ya',
  ユ: 'yu',
  ヨ: 'yo',
  ラ: 'ra',
  リ: 'ri',
  ル: 'ru',
  レ: 're',
  ロ: 'ro',
  ワ: 'wa',
  ヲ: 'wo',
  ン: 'nn',
}

/** 别称输入（ヘボン式 / 其他 IME 变体） */
const KANA_ALT: Record<string, string[]> = {
  し: ['si', 'ci'],
  ち: ['ti'],
  つ: ['tu'],
  ふ: ['hu'],
  じ: ['zi'],
  ぢ: ['di', 'zi'],
  づ: ['du', 'zu'],
  を: ['o'],
  ん: ["n'"],
  シ: ['si', 'ci'],
  チ: ['ti'],
  ツ: ['tu'],
  フ: ['hu'],
  ン: ["n'"],
}

/**
 * 单假名 → 主罗马字序列
 * 例：'し' → 'shi'，'あ' → 'a'
 */
export function charToRomaji(char: string): string {
  return KANA_TO_ROMAJI[char] ?? ''
}

/**
 * 所有合法输入序列（主 + 别称）
 * 用于判定"是否可能是前缀"
 */
export function charToRomajiAll(char: string): string[] {
  const main = KANA_TO_ROMAJI[char]
  if (!main) return []
  const alts = KANA_ALT[char] ?? []
  return [main, ...alts]
}

/**
 * 判断当前输入是否是某假名的合法前缀
 * 例：输入 's' 是 'し'(shi) 的前缀 → true
 *      输入 'x' 不是 → false
 */
export function isRomajiPrefix(input: string, char: string): boolean {
  const candidates = charToRomajiAll(char)
  const lower = input.toLowerCase()
  return candidates.some((c) => c.toLowerCase().startsWith(lower))
}
