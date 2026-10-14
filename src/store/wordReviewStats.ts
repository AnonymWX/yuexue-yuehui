import { atom } from 'jotai'

export interface WordReviewStat {
  wordId: string
  correctCount: number
  wrongCount: number
  streak: number
  level: number
  lastReviewedAt: string | null
  nextReviewAt: string | null
}

// 所有词的复习统计，key 为 wordId
export const wordReviewStatsAtom = atom<Record<string, WordReviewStat>>({})

// 记忆曲线间隔（天）
export const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60] as const

// 计算错误率
export function getWrongRate(stat: WordReviewStat): number {
  const total = stat.correctCount + stat.wrongCount
  if (total === 0) return 0
  return stat.wrongCount / total
}

// 更新统计（答对/答错）
export function applyReview(
  stat: WordReviewStat | undefined,
  wordId: string,
  correct: boolean
): WordReviewStat {
  const now = new Date()
  const base: WordReviewStat = stat ?? {
    wordId,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    level: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
  }

  let level = base.level
  let streak = base.streak

  if (correct) {
    streak += 1
    level = Math.min(level + 1, REVIEW_INTERVALS.length - 1)
  } else {
    streak = 0
    level = 0
  }

  const intervalDays = REVIEW_INTERVALS[level]
  const next = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

  return {
    wordId,
    correctCount: base.correctCount + (correct ? 1 : 0),
    wrongCount: base.wrongCount + (correct ? 0 : 1),
    streak,
    level,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
  }
}