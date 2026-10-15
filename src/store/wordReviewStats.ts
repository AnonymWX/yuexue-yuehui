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
export function applyReview(stat: WordReviewStat | undefined, wordId: string, correct: boolean): WordReviewStat {
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
// ================= 复习统计（新增） =================

export interface ReviewStatsSummary {
  totalReviewed: number
  totalCorrect: number
  accuracy: number
  topWrong: Array<{ wordId: string; wrongCount: number; level: number }>
  dueToday: number
  totalWords: number
}

/** 从本地 stats 计算汇总（纯计算，无副作用） */
export function computeLocalSummary(stats: Record<string, WordReviewStat>): ReviewStatsSummary {
  const entries = Object.entries(stats ?? {})
  let totalReviewed = 0
  let totalCorrect = 0
  const topWrong: ReviewStatsSummary['topWrong'] = []
  let dueToday = 0
  const now = Date.now()

  for (const [wordId, s] of entries) {
    const reviewed = (s.correctCount ?? 0) + (s.wrongCount ?? 0)
    totalReviewed += reviewed
    totalCorrect += s.correctCount ?? 0
    if ((s.wrongCount ?? 0) > 0) {
      topWrong.push({ wordId, wrongCount: s.wrongCount ?? 0, level: s.level ?? 0 })
    }
    if (s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now) dueToday++
  }

  topWrong.sort((a, b) => b.wrongCount - a.wrongCount)

  return {
    totalReviewed,
    totalCorrect,
    accuracy: totalReviewed === 0 ? 0 : totalCorrect / totalReviewed,
    topWrong: topWrong.slice(0, 10),
    dueToday,
    totalWords: entries.length,
  }
}
