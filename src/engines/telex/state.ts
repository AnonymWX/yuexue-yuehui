import { renderChar } from './display'
import { markToKey } from './parse'
import type { CharState, InputResult, Syllable, TelexEngine, ToneType, BackspaceResult } from './types'

type ToneInfo = {
  keyIndex: number
  charIndex: number
  tone: ToneType
}

type Sequence = {
  keys: string
  keyToCharIndex: number[]
  tones: ToneInfo[]
  markPositions: { keyIndex: number; charIndex: number; kind: 'circumflex' | 'breve' | 'horn' | 'stroke' }[]
}

const TONE_KEY_TO_TYPE: Record<string, ToneType> = {
  s: 'acute',
  f: 'grave',
  r: 'hook',
  x: 'tilde',
  j: 'dot',
}

/**
 * 生成一个音节的「基础键 + 变音键 + 声调键」序列
 * 返回 1~2 条序列：
 *  - 声调在末尾
 *  - 声调在主元音后
 */
function generateSyllableSequences(syl: Syllable, syllableStart: number): Sequence[] {
  if (syl.chars.length === 1 && syl.chars[0].isSpace) {
    return [
      {
        keys: ' ',
        keyToCharIndex: [syllableStart],
        tones: [],
        markPositions: [],
      },
    ]
  }

  const baseKeys: string[] = []
  const baseMap: number[] = []
  const marks: Sequence['markPositions'] = []

  for (let ci = 0; ci < syl.chars.length; ci++) {
    const c = syl.chars[ci]
    const globalIdx = syllableStart + ci
    const baseKey = c.isUpper ? c.base.toUpperCase() : c.base

    baseKeys.push(baseKey)
    baseMap.push(globalIdx)

    for (const m of c.marks) {
      const mk = markToKey(c.base, m)
      if (mk) {
        baseKeys.push(mk)
        baseMap.push(globalIdx)
        marks.push({ keyIndex: baseKeys.length - 1, charIndex: globalIdx, kind: m as any })
      }
    }
  }

  // 无声调：只有一条
  if (!syl.toneKey || syl.mainVowelIndex < 0) {
    return [{ keys: baseKeys.join(''), keyToCharIndex: baseMap, tones: [], markPositions: marks }]
  }

  const toneKey = syl.toneKey
  const toneCharIndex = syllableStart + syl.mainVowelIndex
  const toneType = TONE_KEY_TO_TYPE[toneKey]
  if (!toneType) {
    return [{ keys: baseKeys.join(''), keyToCharIndex: baseMap, tones: [], markPositions: marks }]
  }

  // 找主元音相关键的最后一个位置
  let mainLastKeyIdx = -1
  for (let i = 0; i < baseMap.length; i++) {
    if (baseMap[i] === toneCharIndex) mainLastKeyIdx = i
  }

  // 序列 A：声调在主元音后
  const seqAKeys = [...baseKeys]
  const seqAMap = [...baseMap]
  const insertAt = mainLastKeyIdx + 1
  seqAKeys.splice(insertAt, 0, toneKey)
  seqAMap.splice(insertAt, 0, toneCharIndex)

  // 修正 markPositions 的 keyIndex（如果 mark 在 insertAt 之后）
  const seqAMarks = marks.map((m) => ({
    ...m,
    keyIndex: m.keyIndex >= insertAt ? m.keyIndex + 1 : m.keyIndex,
  }))

  const seqA: Sequence = {
    keys: seqAKeys.join(''),
    keyToCharIndex: seqAMap,
    tones: [{ keyIndex: insertAt, charIndex: toneCharIndex, tone: toneType }],
    markPositions: seqAMarks,
  }

  // 序列 B：声调在末尾
  const seqBKeys = [...baseKeys, toneKey]
  const seqBMap = [...baseMap, toneCharIndex]
  const seqB: Sequence = {
    keys: seqBKeys.join(''),
    keyToCharIndex: seqBMap,
    tones: [{ keyIndex: seqBKeys.length - 1, charIndex: toneCharIndex, tone: toneType }],
    markPositions: marks,
  }

  // 让「声调在末尾」排在前面（更符合传统 Telex 习惯）
  if (seqA.keys === seqB.keys) return [seqB]
  return [seqB, seqA]
}

/**
 * 音节间笛卡尔积，拼接出所有合法序列
 */
function generateAllSequences(syllables: Syllable[]): Sequence[] {
  let globalCharIndex = 0
  const perSyllable: Sequence[][] = []

  for (const syl of syllables) {
    perSyllable.push(generateSyllableSequences(syl, globalCharIndex))
    globalCharIndex += syl.chars.length
  }

  let result: Sequence[] = [{ keys: '', keyToCharIndex: [], tones: [], markPositions: [] }]

  for (const seqs of perSyllable) {
    const next: Sequence[] = []
    for (const acc of result) {
      for (const s of seqs) {
        const offset = acc.keys.length
        next.push({
          keys: acc.keys + s.keys,
          keyToCharIndex: [...acc.keyToCharIndex, ...s.keyToCharIndex],
          tones: [...acc.tones, ...s.tones.map((t) => ({ ...t, keyIndex: t.keyIndex + offset }))],
          markPositions: [...acc.markPositions, ...s.markPositions.map((m) => ({ ...m, keyIndex: m.keyIndex + offset }))],
        })
      }
    }
    result = next
  }

  return result
}

function findPrefixMatches(typed: string, sequences: Sequence[]): Sequence[] {
  const lower = typed.toLowerCase()
  return sequences.filter((s) => s.keys.toLowerCase().startsWith(lower))
}

function findFullMatches(typed: string, sequences: Sequence[]): Sequence[] {
  const lower = typed.toLowerCase()
  return sequences.filter((s) => s.keys.toLowerCase() === lower)
}

export class StandardTelexEngine implements TelexEngine {
  private syllables: Syllable[]
  private sequences: Sequence[]
  private typed: string

  constructor(syllables: Syllable[]) {
    this.syllables = syllables
    this.sequences = generateAllSequences(syllables)
    this.typed = ''
  }

  reset(): void {
    this.typed = ''
  }

  isFinished(): boolean {
    return this.typed.length > 0 && findFullMatches(this.typed, this.sequences).length > 0
  }

  getExpectedKeys(): string {
    return this.sequences[0]?.keys ?? ''
  }

  getAllExpectedKeys(): string[] {
    return this.sequences.map((s) => s.keys)
  }

  getDisplay(): string {
    if (this.typed.length === 0) return ''
    const matches = findPrefixMatches(this.typed, this.sequences)
    const best = (matches.length > 0 ? matches : this.sequences).sort((a, b) => b.keys.length - a.keys.length)[0]
    if (!best) return ''
    return this.renderFromTyped(best)
  }

  private renderFromTyped(seq: Sequence): string {
    const flat: CharState[] = []
    for (const syl of this.syllables) {
      for (const c of syl.chars) {
        flat.push({
          base: c.base,
          marks: [],
          tone: null,
          isUpper: c.isUpper,
          isSpace: c.isSpace,
        })
      }
    }

    const n = this.typed.length
    let maxCharIdx = -1

    // 应用变音
    for (const m of seq.markPositions) {
      if (m.keyIndex >= n) continue
      const c = flat[m.charIndex]
      if (!c) continue
      if (m.kind === 'circumflex' || m.kind === 'breve' || m.kind === 'horn' || m.kind === 'stroke') {
        c.marks.push(m.kind)
      }
      if (m.charIndex > maxCharIdx) maxCharIdx = m.charIndex
    }

    // 应用声调
    for (const t of seq.tones) {
      if (t.keyIndex >= n) continue
      const c = flat[t.charIndex]
      if (!c) continue
      c.tone = t.tone
      if (t.charIndex > maxCharIdx) maxCharIdx = t.charIndex
    }

    // 处理已输入的 base 键
    for (let i = 0; i < n; i++) {
      const charIdx = seq.keyToCharIndex[i]
      if (charIdx === undefined) continue
      // 如果这个键被 mark 或 tone 消费了，跳过
      const isMark = seq.markPositions.some((m) => m.keyIndex === i)
      const isTone = seq.tones.some((t) => t.keyIndex === i)
      if (isMark || isTone) continue
      if (charIdx > maxCharIdx) maxCharIdx = charIdx
    }

    let result = ''
    for (let i = 0; i <= maxCharIdx; i++) {
      result += renderChar(flat[i])
    }
    return result.normalize('NFC')
  }

  private getCompletedChars(): number {
    if (this.typed.length === 0) return 0
    const matches = findPrefixMatches(this.typed, this.sequences)
    if (matches.length === 0) return 0
    const best = matches.sort((a, b) => b.keys.length - a.keys.length)[0]
    let maxIdx = -1
    for (let i = 0; i < this.typed.length; i++) {
      const ci = best.keyToCharIndex[i]
      if (ci !== undefined && ci > maxIdx) maxIdx = ci
    }
    return maxIdx + 1
  }

  feed(key: string): InputResult {
    const next = this.typed + key
    const lower = next.toLowerCase()
    const isPrefix = this.sequences.some((s) => s.keys.toLowerCase().startsWith(lower))

    if (!isPrefix) {
      return {
        status: 'reject',
        display: this.getDisplay(),
        failedAtChar: this.getCompletedChars(),
      }
    }

    this.typed = next

    if (findFullMatches(this.typed, this.sequences).length > 0) {
      return { status: 'accept', display: this.getDisplay() }
    }

    return { status: 'pending', display: this.getDisplay(), completedChars: this.getCompletedChars() }
  }

  backspace(): BackspaceResult {
    if (this.typed.length === 0) {
      return { status: 'pending', display: '', completedChars: 0 }
    }
    this.typed = this.typed.slice(0, -1)
    return { status: 'pending', display: this.getDisplay(), completedChars: this.getCompletedChars() }
  }
}
