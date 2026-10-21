import type { Word } from '@/typings'

export type TErrorWordData = {
  word: string
  originData: Word
  errorCount: number
  errorLetters: Record<string, number>
  errorChar: string[]
  latestErrorTime: number
}
