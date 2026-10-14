import type { CharState, KeyStep, MarkType, Syllable, ToneType } from './types'

const MARK_COMBINING: Record<MarkType, string> = {
  circumflex: '\u0302',
  breve: '\u0306',
  horn: '\u031B',
  stroke: '',
}

const TONE_COMBINING: Record<ToneType, string> = {
  acute: '\u0301',
  grave: '\u0300',
  hook: '\u0309',
  tilde: '\u0303',
  dot: '\u0323',
}

export function renderChar(c: CharState): string {
  if (c.isSpace) return ' '

  if (c.marks.includes('stroke')) {
    return c.isUpper ? 'Đ' : 'đ'
  }

  let result = c.base
  for (const m of c.marks) {
    result += MARK_COMBINING[m]
  }
  if (c.tone) {
    result += TONE_COMBINING[c.tone]
  }
  result = result.normalize('NFC')
  if (c.isUpper) {
    result = result.toUpperCase()
  }
  return result
}

export function computeRenderState(syllables: Syllable[], steps: KeyStep[], completedStepCount: number): CharState[] {
  const flat: CharState[] = []
  for (const syl of syllables) {
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

  for (let i = 0; i < completedStepCount; i++) {
    const step = steps[i]
    if (step.phase === 'mark' && step.markType) {
      flat[step.globalCharIndex].marks.push(step.markType)
    } else if (step.phase === 'tone' && step.toneType && step.mainVowelGlobalIndex !== undefined) {
      flat[step.mainVowelGlobalIndex].tone = step.toneType
    }
  }

  return flat
}

export function renderDisplay(syllables: Syllable[], steps: KeyStep[], completedStepCount: number): string {
  if (completedStepCount === 0) return ''

  const rendered = computeRenderState(syllables, steps, completedStepCount)
  const lastStep = steps[completedStepCount - 1]
  const displayUpTo = lastStep.displayUpTo

  let result = ''
  for (let i = 0; i < displayUpTo && i < rendered.length; i++) {
    result += renderChar(rendered[i])
  }
  return result.normalize('NFC')
}
