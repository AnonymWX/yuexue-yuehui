import type { Course } from '@/typings/course'
import type { Sentence } from '@/typings/sentence'
import { useEffect, useState } from 'react'

const LANG_DIR: Record<string, string> = {
  vi: 'vietnamese',
  ja: 'japanese',
  en: 'english',
}

export type ThemeCourseEntry = {
  id: string
  file: string
  title: string
  titleVi?: string
  level?: string
}

export type ThemeWithCourses = {
  id: string
  title: string
  titleVi: string
  courses: ThemeCourseEntry[]
}

/** 某语言下的所有主题（含每主题课程列表） */
export function useCourseStructure(lang: string | undefined) {
  const [themes, setThemes] = useState<ThemeWithCourses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lang) {
      setLoading(false)
      return
    }
    const dir = LANG_DIR[lang] ?? lang
    setLoading(true)
    setError(null)

    fetch('/courses/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Record<string, string[]>>
      })
      .then(async (top) => {
        const themeIds = top[lang] ?? []
        const themes = await Promise.all(
          themeIds.map((tid) =>
            fetch(`/courses/${dir}/${tid}/index.json`).then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status} - ${dir}/${tid}/index.json`)
              return r.json() as Promise<ThemeWithCourses>
            }),
          ),
        )
        setThemes(themes)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang])

  return { themes, loading, error }
}

/** 某个主题（含课程列表） */
export function useTheme(lang: string | undefined, themeId: string | undefined) {
  const [theme, setTheme] = useState<ThemeWithCourses | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lang || !themeId) {
      setLoading(false)
      return
    }
    const dir = LANG_DIR[lang] ?? lang
    setLoading(true)
    setError(null)

    fetch(`/courses/${dir}/${themeId}/index.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} - ${dir}/${themeId}/index.json`)
        return r.json()
      })
      .then(setTheme)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang, themeId])

  return { theme, loading, error }
}

/** 某课 */
export function useCourse(lang: string | undefined, themeId: string | undefined, no: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lang || !themeId || !no) {
      setLoading(false)
      return
    }
    const dir = LANG_DIR[lang] ?? lang
    setLoading(true)
    setError(null)

    fetch(`/courses/${dir}/${themeId}/course_${no}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} - /courses/${dir}/${themeId}/course_${no}.json`)
        return r.json()
      })
      .then(setCourse)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang, themeId, no])

  return { course, loading, error }
}

/** 句子：不变 */
export function useSentences(lang: string | undefined) {
  const [data, setData] = useState<Sentence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lang) {
      setData([])
      setLoading(false)
      return
    }
    const dir = LANG_DIR[lang] ?? lang
    setLoading(true)
    fetch(`/sentences/${dir}_sentences.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [lang])

  return { sentences: data, loading }
}
