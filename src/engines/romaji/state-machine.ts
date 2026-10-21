// src/engines/romaji/state-machine.ts
const ROMAJI_MAP: Record<string, string> = {
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
const ALL_PREFIXES: Record<string, true> = {}
;(function buildPrefixes() {
  Object.keys(ROMAJI_MAP).forEach((k) => {
    for (let i = 1; i < k.length; i++) ALL_PREFIXES[k.slice(0, i)] = true
  })
})()
const CONSONANTS = 'bcdfghjkmnpqrstvwxyz'
function isConsonant(ch: string): boolean {
  return CONSONANTS.indexOf(ch.toLowerCase()) >= 0
}
function longestMatch(s: string): { kana: string; len: number } | null {
  for (let len = Math.min(4, s.length); len >= 1; len--) {
    const sub = s.slice(0, len)
    if (ROMAJI_MAP[sub]) return { kana: ROMAJI_MAP[sub], len }
  }
  return null
}

export interface RomajiEngine {
  feed(key: string): { status: 'ok' | 'reject'; display: string }
  get display(): string
  reset(): void
}

export function createRomajiEngine(): RomajiEngine {
  let output = '',
    pending = ''
  function tryParse(): 'ok' | 'reject' {
    while (pending.length > 0) {
      if (ALL_PREFIXES[pending]) return 'ok'
      const m = longestMatch(pending)
      if (m) {
        output += m.kana
        pending = pending.slice(m.len)
        continue
      }
      if (pending.length >= 2 && pending.charAt(0) === pending.charAt(1) && isConsonant(pending.charAt(0))) {
        output += 'っ'
        pending = pending.slice(1)
        continue
      }
      return 'reject'
    }
    return 'ok'
  }
  return {
    feed(key: string) {
      if (key.length !== 1 || !/[a-zA-Z']/.test(key)) return { status: 'reject', display: output + pending }
      const prevOutput = output,
        prevPending = pending
      pending += key.toLowerCase()
      if (tryParse() === 'reject') {
        output = prevOutput
        pending = prevPending
        return { status: 'reject', display: output + pending }
      }
      return { status: 'ok', display: output + pending }
    },
    get display() {
      return output + pending
    },
    reset() {
      output = ''
      pending = ''
    },
  }
}
