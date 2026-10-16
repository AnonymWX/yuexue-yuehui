// src/engines/beolsik/state-machine.ts
// 韩语 2-beolsik 输入状态机
// 规则：KS X 5002 标准
// 特点：初声/中声/终声三段组合 + 复合元音 + 复合终声 + 终声迁移

/** QWERTY 键 → jamo（大小写区分紧音） */
const KEY_TO_JAMO: Record<string, string> = {
  // 辅音
  q: 'ㅂ',
  Q: 'ㅃ',
  w: 'ㅈ',
  W: 'ㅉ',
  e: 'ㄷ',
  E: 'ㄸ',
  r: 'ㄱ',
  R: 'ㄲ',
  t: 'ㅅ',
  T: 'ㅆ',
  a: 'ㅁ',
  s: 'ㄴ',
  d: 'ㅇ',
  f: 'ㄹ',
  g: 'ㅎ',
  z: 'ㅋ',
  x: 'ㅌ',
  c: 'ㅊ',
  v: 'ㅍ',
  // 元音
  y: 'ㅛ',
  u: 'ㅕ',
  i: 'ㅑ',
  o: 'ㅐ',
  O: 'ㅒ',
  p: 'ㅔ',
  P: 'ㅖ',
  h: 'ㅗ',
  j: 'ㅓ',
  k: 'ㅏ',
  l: 'ㅣ',
  n: 'ㅜ',
  m: 'ㅡ',
  b: 'ㅠ',
}

const CHOSEONG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const JUNGSEONG_LIST = [
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
const JONGSEONG_LIST = [
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

const COMPOUND_VOWELS: Record<string, string> = {
  ㅗㅏ: 'ㅘ',
  ㅗㅐ: 'ㅙ',
  ㅗㅣ: 'ㅚ',
  ㅜㅓ: 'ㅝ',
  ㅜㅔ: 'ㅞ',
  ㅜㅣ: 'ㅟ',
  ㅡㅣ: 'ㅢ',
}

const COMPOUND_FINALS: Record<string, string> = {
  ㄱㅅ: 'ㄳ',
  ㄴㅈ: 'ㄵ',
  ㄴㅎ: 'ㄶ',
  ㄹㄱ: 'ㄺ',
  ㄹㅁ: 'ㄻ',
  ㄹㅂ: 'ㄼ',
  ㄹㅅ: 'ㄽ',
  ㄹㅌ: 'ㄾ',
  ㄹㅍ: 'ㄿ',
  ㄹㅎ: 'ㅀ',
  ㅂㅅ: 'ㅄ',
}

function isVowel(jamo: string): boolean {
  return JUNGSEONG_LIST.indexOf(jamo) >= 0
}

function composeSyllable(cho: string, jung: string, jong: string): string {
  const choIdx = CHOSEONG_LIST.indexOf(cho)
  const jungIdx = JUNGSEONG_LIST.indexOf(jung)
  const jongIdx = jong ? JONGSEONG_LIST.indexOf(jong) : 0

  if (choIdx < 0 || jungIdx < 0 || jongIdx < 0) {
    return cho + jung + jong
  }
  const code = 0xac00 + choIdx * 21 * 28 + jungIdx * 28 + jongIdx
  return String.fromCharCode(code)
}

interface State {
  cho: string
  jung: string
  jong: string
  hasJung: boolean
}

function emptyState(): State {
  return { cho: '', jung: '', jong: '', hasJung: false }
}

export interface BeolsikEngine {
  feed(key: string): { status: 'ok' | 'reject'; display: string }
  get display(): string
  reset(): void
}

export function createBeolsikEngine(): BeolsikEngine {
  let output = ''
  let state: State = emptyState()

  function currentComposition(): string {
    if (!state.cho && !state.jung) return ''
    if (!state.hasJung) return state.cho
    return composeSyllable(state.cho || 'ㅇ', state.jung, state.jong)
  }

  function flush() {
    output += currentComposition()
    state = emptyState()
  }

  function currentDisplay(): string {
    return output + currentComposition()
  }

  return {
    feed(key: string) {
      const jamo = KEY_TO_JAMO[key]
      if (!jamo) {
        return { status: 'reject', display: currentDisplay() }
      }

      // 情况 1：空闲
      if (!state.cho && !state.jung) {
        if (isVowel(jamo)) {
          state = { cho: 'ㅇ', jung: jamo, jong: '', hasJung: true }
        } else {
          state = { cho: jamo, jung: '', jong: '', hasJung: false }
        }
        return { status: 'ok', display: currentDisplay() }
      }

      // 情况 2：只有初声
      if (!state.hasJung) {
        if (isVowel(jamo)) {
          // 初声非法（如复合 ㄳ）→ 先输出，再起新字
          if (CHOSEONG_LIST.indexOf(state.cho) < 0) {
            flush()
            state = { cho: 'ㅇ', jung: jamo, jong: '', hasJung: true }
          } else {
            state.jung = jamo
            state.hasJung = true
          }
          return { status: 'ok', display: currentDisplay() }
        }
        // 辅音 → 尝试复合
        const compound = COMPOUND_FINALS[state.cho + jamo]
        if (compound) {
          state.cho = compound
          return { status: 'ok', display: currentDisplay() }
        }
        // 不复合 → 前一个输出，新字开始
        flush()
        state = { cho: jamo, jung: '', jong: '', hasJung: false }
        return { status: 'ok', display: currentDisplay() }
      }

      // 情况 3：有初声 + 中声，无终声
      if (!state.jong) {
        if (isVowel(jamo)) {
          const compound = COMPOUND_VOWELS[state.jung + jamo]
          if (compound) {
            state.jung = compound
            return { status: 'ok', display: currentDisplay() }
          }
          // 不复合 → 当前字结束，新字
          flush()
          state = { cho: 'ㅇ', jung: jamo, jong: '', hasJung: true }
          return { status: 'ok', display: currentDisplay() }
        }
        // 辅音 → 尝试作终声
        if (JONGSEONG_LIST.indexOf(jamo) >= 0) {
          state.jong = jamo
          return { status: 'ok', display: currentDisplay() }
        }
        // 不能作终声（如紧音 ㄸ）→ 当前字结束
        flush()
        state = { cho: jamo, jung: '', jong: '', hasJung: false }
        return { status: 'ok', display: currentDisplay() }
      }

      // 情况 4：有终声
      if (isVowel(jamo)) {
        // 终声迁移为下一字初声
        const prevJong = state.jong
        state.jong = ''
        output += currentComposition()
        state = { cho: prevJong, jung: jamo, jong: '', hasJung: true }
        return { status: 'ok', display: currentDisplay() }
      }
      // 辅音 → 尝试复合终声
      const compound = COMPOUND_FINALS[state.jong + jamo]
      if (compound) {
        state.jong = compound
        return { status: 'ok', display: currentDisplay() }
      }
      // 不复合 → 当前字结束，新字
      flush()
      state = { cho: jamo, jung: '', jong: '', hasJung: false }
      return { status: 'ok', display: currentDisplay() }
    },
    get display() {
      return currentDisplay()
    },
    reset() {
      output = ''
      state = emptyState()
    },
  }
}
