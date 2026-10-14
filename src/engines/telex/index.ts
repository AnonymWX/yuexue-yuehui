import { parseVietnamese } from './parse'
import { StandardTelexEngine } from './state'
import type { TelexEngine } from './types'

export type { CharState, Syllable, InputResult, TelexEngine, KeyStep } from './types'
export { parseVietnamese } from './parse'
export { renderChar, renderDisplay } from './display'

export function createTelexEngine(word: string): TelexEngine {
  const syllables = parseVietnamese(word)
  return new StandardTelexEngine(syllables)
}
