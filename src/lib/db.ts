import type { WordReviewStat } from '../store/wordReviewStats'
import { notifyNetError } from './netError'
import { supabase } from './supabase'

// ============================================
// 类型
// ============================================

export type LessonProgressRow = {
  user_id: string
  course_id: string
  current_step: number
  completed: number
  finished: boolean
  updated_at: string
}

export type DailyReviewRow = {
  user_id: string
  review_date: string
  word_ids: string[]
  done: number
  total: number
}

export type PracticeProgressRow = {
  user_id: string
  mode: string
  data: unknown
  updated_at: string
}

// ============================================
// 课程进度
// ============================================

export async function fetchAllLessonProgress(userId: string): Promise<LessonProgressRow[]> {
  const { data, error } = await supabase.from('lesson_progress').select('*').eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

export async function upsertLessonProgress(userId: string, courseId: string, step: number, finished: boolean): Promise<void> {
  const { error } = await supabase.from('lesson_progress').upsert({
    user_id: userId,
    course_id: courseId,
    current_step: step,
    completed: step,
    finished,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function clearLessonProgress(userId: string, courseId: string): Promise<void> {
  const { error } = await supabase.from('lesson_progress').delete().eq('user_id', userId).eq('course_id', courseId)

  if (error) throw error
}

// ============================================
// 每日复习
// ============================================

export async function fetchDailyReview(userId: string, date: string): Promise<DailyReviewRow | null> {
  const { data, error } = await supabase.from('daily_review').select('*').eq('user_id', userId).eq('review_date', date).maybeSingle()

  if (error) throw error
  return data
}

export async function upsertDailyReview(
  userId: string,
  date: string,
  payload: { wordIds: string[]; done: number; total: number },
): Promise<void> {
  const { error } = await supabase.from('daily_review').upsert({
    user_id: userId,
    review_date: date,
    word_ids: payload.wordIds,
    done: payload.done,
    total: payload.total,
  })

  if (error) throw error
}

// ============================================
// 练习进度（声调 / 字符）
// ============================================

export async function fetchPracticeProgress(userId: string, mode: string): Promise<PracticeProgressRow | null> {
  const { data, error } = await supabase.from('practice_progress').select('*').eq('user_id', userId).eq('mode', mode).maybeSingle()

  if (error) throw error
  return data
}

export async function upsertPracticeProgress(userId: string, mode: string, data: unknown): Promise<void> {
  const { error } = await supabase.from('practice_progress').upsert({
    user_id: userId,
    mode,
    data,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

// ===== word_review_stats =====

export async function fetchWordReviewStats(userId: string): Promise<WordReviewStat[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('word_review_stats').select('*').eq('user_id', userId)

  if (error) {
    notifyNetError(error, '加载复习进度失败')
    return []
  }

  return (data ?? []).map((r: any) => ({
    wordId: r.word_id,
    correctCount: r.correct_count ?? 0,
    wrongCount: r.wrong_count ?? 0,
    streak: r.streak ?? 0,
    level: r.level ?? 0,
    lastReviewedAt: r.last_reviewed_at,
    nextReviewAt: r.next_review_at,
  }))
}

export async function upsertWordReviewStat(userId: string, stat: WordReviewStat): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('word_review_stats').upsert(
    {
      user_id: userId,
      word_id: stat.wordId,
      correct_count: stat.correctCount,
      wrong_count: stat.wrongCount,
      streak: stat.streak,
      level: stat.level,
      last_reviewed_at: stat.lastReviewedAt,
      next_review_at: stat.nextReviewAt,
    },
    { onConflict: 'user_id,word_id' },
  )
  if (error) notifyNetError(error, '同步复习进度失败')
}

export async function upsertWordReviewStats(userId: string, stats: WordReviewStat[]): Promise<void> {
  if (!supabase || stats.length === 0) return
  const rows = stats.map((s) => ({
    /* 同前 */
  }))
  const { error } = await supabase.from('word_review_stats').upsert(rows, { onConflict: 'user_id,word_id' })
  if (error) notifyNetError(error, '同步复习进度失败')
}
