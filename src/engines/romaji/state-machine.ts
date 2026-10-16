// src/engines/romaji/state-machine.ts
// 日语罗马字输入状态机
// 规则：训令式 + ヘボン式（多入口）
// 特点：最左最长匹配 + 前缀等待 + 促音 + 拨音

/** 罗马字 → 假名映射 */
const ROMAJI_MAP: Record<string, string> = {
  // ===== 五十音 =====
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  sa: 'さ',
  si: 'し',
  shi: 'し',
  su: 'す',
  se: 'せ',
  so: 'そ',
  ta: 'た',
  ti: 'ち',
  chi: 'ち',
  tu: 'つ',
  tsu: 'つ',
  te: 'て',
  to: 'と',
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  ha: 'は',
  hi: 'ひ',
  hu: 'ふ',
  fu: 'ふ',
  he: 'へ',
  ho: 'ほ',
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  wa: 'わ',
  wo: 'を',
  n: 'ん',
  "n'": 'ん',
  nn: 'ん',

  // ===== 浊音 / 半浊音 =====
  ga: 'が',
  gi: 'ぎ',
  gu: 'ぐ',
  ge: 'げ',
  go: 'ご',
  za: 'ざ',
  zi: 'じ',
  ji: 'じ',
  zu: 'ず',
  ze: 'ぜ',
  zo: 'ぞ',
  da: 'だ',
  di: 'ぢ',
  du: 'づ',
  de: 'で',
  do: 'ど',
  ba: 'ば',
  bi: 'び',
  bu: 'ぶ',
  be: 'べ',
  bo: 'ぼ',
  pa: 'ぱ',
  pi: 'ぴ',
  pu: 'ぷ',
  pe: 'ぺ',
  po: 'ぽ',

  // ===== 拗音 =====
  kya: 'きゃ',
  kyu: 'きゅ',
  kyo: 'きょ',
  sha: 'しゃ',
  shu: 'しゅ',
  sho: 'しょ',
  sya: 'しゃ',
  syu: 'しゅ',
  syo: 'しょ',
  cha: 'ちゃ',
  chu: 'ちゅ',
  cho: 'ちょ',
  tya: 'ちゃ',
  tyu: 'ちゅ',
  tyo: 'ちょ',
  nya: 'にゃ',
  nyu: 'にゅ',
  nyo: 'にょ',
  hya: 'ひゃ',
  hyu: 'ひゅ',
  hyo: 'ひょ',
  mya: 'みゃ',
  myu: 'みゅ',
  myo: 'みょ',
  rya: 'りゃ',
  ryu: 'りゅ',
  ryo: 'りょ',
  gya: 'ぎゃ',
  gyu: 'ぎゅ',
  gyo: 'ぎょ',
  ja: 'じゃ',
  ju: 'じゅ',
  jo: 'じょ',
  zya: 'じゃ',
  zyu: 'じゅ',
  zyo: 'じょ',
  bya: 'びゃ',
  byu: 'びゅ',
  byo: 'びょ',
  pya: 'ぴゃ',
  pyu: 'ぴゅ',
  pyo: 'ぴょ',

  // ===== 小写假名 =====
  la: 'ぁ',
  li: 'ぃ',
  lu: 'ぅ',
  le: 'ぇ',
  lo: 'ぉ',
  lya: 'ゃ',
  lyu: 'ゅ',
  lyo: 'ょ',
  ltu: 'っ',
  ltsu: 'っ',
  xa: 'ぁ',
  xi: 'ぃ',
  xu: 'ぅ',
  xe: 'ぇ',
  xo: 'ぉ',
  xya: 'ゃ',
  xyu: 'ゅ',
  xyo: 'ょ',
  xtu: 'っ',
  xtsu: 'っ',
}

/** 预计算：所有「可能是更长 key 前缀」的字符串 */
const ALL_PREFIXES: Record<string, true> = {}
;(function buildPrefixes() {
  const keys = Object.keys(ROMAJI_MAP)
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    for (let j = 1; j < k.length; j++) {
      ALL_PREFIXES[k.slice(0, j)] = true
    }
  }
})()

/** 促音前置辅音（不含 l / x，它们用于小写假名） */
const CONSONANTS = 'bcdfghjkmnpqrstvwxyz'

function isConsonant(ch: string): boolean {
  return CONSONANTS.indexOf(ch.toLowerCase()) >= 0
}

/** 匹配最长的罗马字（最多 4 字符） */
function longestMatch(s: string): { kana: string; len: number } | null {
  const maxLen = Math.min(4, s.length)
  for (let len = maxLen; len >= 1; len--) {
    const sub = s.slice(0, len)
    if (ROMAJI_MAP[sub]) {
      return { kana: ROMAJI_MAP[sub], len }
    }
  }
  return null
}

export interface RomajiEngine {
  feed(key: string): { status: 'ok' | 'reject'; display: string }
  get display(): string
  reset(): void
}

export function createRomajiEngine(): RomajiEngine {
  let output = ''
  let pending = ''

  /** 反复从 pending 开头消除，直到剩下「可能成为更长 key 前缀」的部分 */
  function tryParse(): 'ok' | 'reject' {
    while (pending.length > 0) {
      // 整体是更长 key 的前缀 → 等待更多输入
      if (ALL_PREFIXES[pending]) return 'ok'

      // 最长匹配
      const m = longestMatch(pending)
      if (m) {
        output += m.kana
        pending = pending.slice(m.len)
        continue
      }

      // 促音：连续两个相同辅音
      if (pending.length >= 2 && pending.charAt(0) === pending.charAt(1) && isConsonant(pending.charAt(0))) {
        output += 'っ'
        pending = pending.slice(1)
        continue
      }

      // 无法消除 → pending 开头非法
      return 'reject'
    }
    return 'ok'
  }

  function currentDisplay(): string {
    return output + pending
  }

  return {
    feed(key: string) {
      if (key.length !== 1) {
        return { status: 'reject', display: currentDisplay() }
      }
      if (!/[a-zA-Z']/.test(key)) {
        return { status: 'reject', display: currentDisplay() }
      }

      const prevOutput = output
      const prevPending = pending

      pending += key.toLowerCase()
      const r = tryParse()

      if (r === 'reject') {
        output = prevOutput
        pending = prevPending
        return { status: 'reject', display: currentDisplay() }
      }
      return { status: 'ok', display: currentDisplay() }
    },
    get display() {
      return currentDisplay()
    },
    reset() {
      output = ''
      pending = ''
    },
  }
}
