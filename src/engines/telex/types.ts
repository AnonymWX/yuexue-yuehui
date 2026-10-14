export type MarkType = 'circumflex' | 'breve' | 'horn' | 'stroke'
export type ToneType = 'acute' | 'grave' | 'hook' | 'tilde' | 'dot'

export type CharState = {
  base: string
  marks: MarkType[]
  tone: ToneType | null
  isUpper: boolean
  isSpace: boolean
}

export type Syllable = {
  chars: CharState[]
  mainVowelIndex: number
  toneKey: string | null
}

export type KeyStep = {
  key: string
  phase: 'base' | 'mark' | 'tone' | 'space'
  syllableIndex: number
  charIndex: number
  globalCharIndex: number
  mainVowelGlobalIndex?: number
  markType?: MarkType
  toneType?: ToneType
  displayUpTo: number
}

export type InputResult =
  | { status: 'pending'; display: string; completedChars: number }
  | { status: 'accept'; display: string }
  | { status: 'reject'; display: string; failedAtChar: number }

export type BackspaceResult = {
  status: 'pending'
  display: string
  completedChars: number
}

export interface TelexEngine {
  reset(): void
  feed(key: string): InputResult
  backspace(): BackspaceResult
  getExpectedKeys(): string
  getAllExpectedKeys(): string[]
  getDisplay(): string
  isFinished(): boolean
}
