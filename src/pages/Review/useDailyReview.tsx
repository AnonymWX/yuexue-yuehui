import { fetchWordReviewStats, upsertWordReviewStats } from '../../lib/db'
import { lessonProgressAtom, lessonProgressLoadedAtom } from '../../store/lessonProgress'
import { wordReviewStatsAtom, applyReview, getWrongRate, type WordReviewStat } from '../../store/wordReviewStats'
import { userIdAtom } from '../Login/useAuth'
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

/** 语言 code → 课程目录名 */
const LANG_DIR: Record<string, string> = {
  vi: 'vietnamese',
  en: 'english',
  ja: 'japanese',
  ko: 'korean',
}

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

// ================= 加载课程词库 =================

async function loadWordsForCourses(lang: string, courseIds: string[]): Promise<ReviewWord[]> {
  const dir = LANG_DIR[lang] ?? lang
  const wanted = new Set(courseIds)
  const result: ReviewWord[] = []
  const seen = new Set<string>()

  try {
    const topRes = await fetch('/courses/index.json')
    if (!topRes.ok) return []
    const top = await topRes.json()
    const topics: string[] = top[lang] ?? []

    for (const topic of topics) {
      const idxRes = await fetch(`/courses/${dir}/${topic}/index.json`)
      if (!idxRes.ok) continue
      const idx = await idxRes.json()
      const courses: any[] = idx.courses ?? []

      for (const c of courses) {
        if (!c.id || !wanted.has(c.id)) continue
        const cRes = await fetch(`/courses/${dir}/${topic}/${c.file}`)
        if (!cRes.ok) continue
        const courseJson = await cRes.json()
        const words: any[] = courseJson.words ?? []
        for (const w of words) {
          if (!w.id || !w.name) continue
          if (seen.has(w.id)) continue
          seen.add(w.id)
          result.push({ id: w.id, name: w.name, trans: w.trans ?? [] })
        }
      }
    }
  } catch (e) {
    console.error('loadWordsForCourses error:', e)
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

  const buildToday = useCallback(
    async (forceNew: boolean) => {
      setLoading(true)

      const courseIds = getLearnedCourseIds(lang, lessonMap)
      const all = await loadWordsForCourses(lang, courseIds)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, lessonMap, statsMap],
  )

  // 等课程进度加载完成 & lang 变化时重建
  useEffect(() => {
    if (!lessonLoaded) return
    buildToday(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, lessonLoaded])

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

  return { state, words, loading, hasEnough, markDone, restart }
}
