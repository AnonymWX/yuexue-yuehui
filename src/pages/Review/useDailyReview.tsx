// src/pages/Review/useDailyReview.ts
import { fetchWordReviewStats, upsertWordReviewStats } from '../../lib/db'
import { lessonProgressAtom, lessonProgressLoadedAtom } from '../../store/lessonProgress'
import { wordReviewStatsAtom, applyReview, getWrongRate, type WordReviewStat } from '../../store/wordReviewStats'
import { getAllCoursesDetail } from '../Course/hooks/useCourse'
import { userIdAtom } from '../Login/useAuth'
// ⬅️ 新增：复用预加载数据
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'

// ================= 类型 =================

export interface ReviewWord {
  id: string
  name: string
  trans: string[]
}

interface ReviewState {
  done: number
  total: number
}

interface DailyRecord {
  date: string
  wordIds: string[]
  results: { wordId: string; correct: boolean }[]
}

// ================= 常量 =================

const DAILY_COUNT = 10

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 每种语言独立的每日复习 key */
function dailyKey(lang: string): string {
  return `daily_review_v1_${lang}`
}

function loadLocalDaily(lang: string): DailyRecord | null {
  try {
    const raw = localStorage.getItem(dailyKey(lang))
    if (!raw) return null
    const rec = JSON.parse(raw) as DailyRecord
    if (rec.date !== todayStr()) return null
    return rec
  } catch {
    return null
  }
}

function saveLocalDaily(lang: string, rec: DailyRecord) {
  localStorage.setItem(dailyKey(lang), JSON.stringify(rec))
}

// ================= 已学课程 id（按语言过滤）=================

type LessonMap = Record<string, { finished: boolean; completed: number }>

function getLearnedCourseIds(lang: string, lessonMap: LessonMap): string[] {
  const prefix = `course_${lang}_`
  return Object.keys(lessonMap).filter((id) => id.startsWith(prefix))
}

// ================= 加载课程词库 (重构为同步内存读取) =================

function buildWordPool(lang: string, courseIds: string[]): ReviewWord[] {
  const wanted = new Set(courseIds)
  // ⬇️ 直接从 Vite 预加载的内存中获取所有课程，不再发 fetch 请求
  const allCourses = getAllCoursesDetail(lang)
  const learnedCourses = allCourses.filter((c) => wanted.has(c.id))

  const result: ReviewWord[] = []
  const seen = new Set<string>()

  for (const c of learnedCourses) {
    for (const w of c.words || []) {
      if (!w.id || !w.name) continue
      if (seen.has(w.id)) continue
      seen.add(w.id)
      result.push({ id: w.id, name: w.name, trans: w.trans ?? [] })
    }
  }
  return result
}

// ================= 抽词 =================

function pickTodayWords(allWords: ReviewWord[], statsMap: Record<string, WordReviewStat>, count = DAILY_COUNT): ReviewWord[] {
  const now = Date.now()
  const due: { w: ReviewWord; stat: WordReviewStat }[] = []

  for (const w of allWords) {
    const s = statsMap[w.id]
    if (!s) continue
    if (s.nextReviewAt && new Date(s.nextReviewAt).getTime() <= now) {
      due.push({ w, stat: s })
    }
  }

  due.sort((a, b) => getWrongRate(b.stat) - getWrongRate(a.stat))
  const picked = due.slice(0, count).map((x) => x.w)

  if (picked.length < count) {
    const pickedSet = new Set(picked.map((w) => w.id))
    const rest = allWords.filter((w) => !pickedSet.has(w.id))
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }
    picked.push(...rest.slice(0, count - picked.length))
  }

  return picked.slice(0, count)
}

// ================= 全局初始化（在 index.tsx 注册）=================

export function useWordReviewStatsInit() {
  const [userId] = useAtom(userIdAtom)
  const [, setStats] = useAtom(wordReviewStatsAtom)

  useEffect(() => {
    if (!userId) {
      setStats({})
      return
    }
    setStats({})
    fetchWordReviewStats(userId).then((list) => {
      const map: Record<string, WordReviewStat> = {}
      list.forEach((s) => (map[s.wordId] = s))
      setStats(map)
    })
  }, [userId, setStats])
}

// ================= 主 hook =================

export function useDailyReview(lang: string) {
  const [statsMap, setStatsMap] = useAtom(wordReviewStatsAtom)
  const [userId] = useAtom(userIdAtom)
  const lessonMap = useAtomValue(lessonProgressAtom) as LessonMap
  const lessonLoaded = useAtomValue(lessonProgressLoadedAtom)

  const [words, setWords] = useState<ReviewWord[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(0)

  // ⬇️ 改为同步函数，因为 buildWordPool 是同步的
  const buildToday = useCallback(
    (forceNew: boolean) => {
      setLoading(true)

      const courseIds = getLearnedCourseIds(lang, lessonMap)
      const all = buildWordPool(lang, courseIds) // ⬅️ 同步获取词池

      let todayWords: ReviewWord[]
      if (!forceNew) {
        const local = loadLocalDaily(lang)
        if (local && local.wordIds.length > 0) {
          const map = new Map(all.map((w) => [w.id, w]))
          todayWords = local.wordIds.map((id) => map.get(id)).filter((w): w is ReviewWord => !!w)
          if (todayWords.length > 0) {
            setWords(todayWords)
            setDone(local.results.length)
            setLoading(false)
            return
          }
        }
      }

      todayWords = pickTodayWords(all, statsMap)
      saveLocalDaily(lang, {
        date: todayStr(),
        wordIds: todayWords.map((w) => w.id),
        results: [],
      })
      setWords(todayWords)
      setDone(0)
      setLoading(false)
    },
    [lang, lessonMap, statsMap],
  )

  // 等课程进度加载完成 & lang 变化时重建
  useEffect(() => {
    if (!lessonLoaded) return
    buildToday(false)
  }, [lang, lessonLoaded, buildToday])

  const markDone = useCallback(async () => {
    const current = words[done]
    if (!current) return

    const prev = statsMap[current.id]
    const updated = applyReview(prev, current.id, true)
    const nextMap = { ...statsMap, [current.id]: updated }
    setStatsMap(nextMap)

    const local = loadLocalDaily(lang) ?? {
      date: todayStr(),
      wordIds: words.map((w) => w.id),
      results: [],
    }
    local.results = [...local.results.filter((r) => r.wordId !== current.id), { wordId: current.id, correct: true }]
    saveLocalDaily(lang, local)

    if (userId) {
      upsertWordReviewStats(userId, [updated]).catch(() => {})
    }

    setDone((d) => d + 1)
  }, [words, done, statsMap, setStatsMap, userId, lang])

  const restart = useCallback(() => {
    localStorage.removeItem(dailyKey(lang))
    buildToday(true)
  }, [buildToday, lang])

  const state: ReviewState = { done, total: words.length }
  const hasEnough = words.length >= DAILY_COUNT

  // ⬅️ 新增：只更新统计，不推进 done / 不写 results
  // results 仍只记「最终答对」，保持 done 计数语义不变
  const markWrong = useCallback(
    (wordId?: string) => {
      const target = wordId ? words.find((w) => w.id === wordId) : words[done]
      if (!target) return

      setStatsMap((m) => {
        const prev = m[target.id]
        const updated = applyReview(prev, target.id, false)
        if (userId) {
          upsertWordReviewStats(userId, [updated]).catch(() => {})
        }
        return { ...m, [target.id]: updated }
      })
    },
    [words, done, setStatsMap, userId],
  )
  return { state, words, loading, hasEnough, markDone, markWrong, restart }
}
