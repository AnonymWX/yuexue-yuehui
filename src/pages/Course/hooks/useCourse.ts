// src/pages/Course/hooks/useCourse.ts
import topLevelData from '../../../courses/index.json'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

/* ---------- 类型 ---------- */
export interface Stage {
  id: string
  title: string
  titleVi: string
  cefr: string
  themes: string[]
}

export interface CourseMeta {
  id: string
  file: string
  title: string
  titleVi: string
  level: string
  order?: number
}

export interface ThemeMeta {
  id: string
  stage: string
  lang: string
  title: string
  titleVi: string
  courses: CourseMeta[]
}

export interface CourseDetail {
  id: string
  title: string
  titleVi: string
  level: string
  order: number
  scenario: string
  goals: string[]
  words: any[]
  sentences: string[]
  grammar: any[]
  telex: any[]
  exercises: any[]
}

export interface Sentence {
  id: string
  text: string
  translation: string
  words: string[]
  course: string
  tags: string[]
}

/* ---------- 语言 ↔ 目录名 映射（加新语言只需在这里加一行） ---------- */
export const LANG_DIR: Record<string, string> = {
  vi: 'vietnamese',
  en: 'english',
  ja: 'japanese',
  ko: 'korean',
}
const DIR_LANG: Record<string, string> = Object.fromEntries(Object.entries(LANG_DIR).map(([lang, dir]) => [dir, lang]))

/* ---------- 顶层结构（新老兼容） ---------- */
type TopLevel = Record<string, { stages?: Stage[]; themes?: string[] }>
const raw = topLevelData as TopLevel

function normalizeStages(lang: string): Stage[] {
  const data = raw[lang]
  if (!data) return []
  if (data.stages) return data.stages
  if (data.themes) {
    return [
      {
        id: 'a1',
        title: '第一阶段',
        titleVi: 'Bậc 1',
        cefr: 'A1',
        themes: data.themes,
      },
    ]
  }
  return []
}

/* ---------- 全语言扫描（多语言隔离的关键） ---------- */
const themeModules = import.meta.glob<{ default: any }>('/src/courses/*/*/*/index.json', { eager: true })
const courseModules = import.meta.glob<{ default: any }>('/src/courses/*/*/*/course_*.json', { eager: true })
const sentenceModules = import.meta.glob<{ default: any }>('/src/sentences/*_sentences.json', { eager: true })

// key: /src/courses/<langDir>/<stage>/<theme>/<file>
function parsePath(key: string) {
  const parts = key.split('/')
  if (parts.length !== 7) return null
  return { langDir: parts[3], stage: parts[4], theme: parts[5], file: parts[6] }
}

interface ThemeEntry {
  meta: ThemeMeta
  lang: string
  stage: string
}

const themeEntries: ThemeEntry[] = []
for (const [key, mod] of Object.entries(themeModules)) {
  const p = parsePath(key)
  if (!p) continue
  const lang = DIR_LANG[p.langDir] ?? p.langDir
  const json = mod.default as any
  themeEntries.push({
    lang,
    stage: json.stage || p.stage,
    meta: {
      id: json.id || p.theme,
      stage: json.stage || p.stage,
      lang,
      title: json.title || p.theme,
      titleVi: json.titleVi || '',
      courses: json.courses || [],
    },
  })
}

// 句子库按语言隔离
const sentencesByLang: Record<string, Sentence[]> = {}
for (const [key, mod] of Object.entries(sentenceModules)) {
  const m = key.match(/\/src\/sentences\/(.+)_sentences\.json$/)
  if (!m) continue
  const lang = DIR_LANG[m[1]] ?? m[1]
  sentencesByLang[lang] = mod.default as Sentence[]
}

/* ---------- 当前语言（显式传参优先，否则读 store） ---------- */
function useLang(explicit?: string): string {
  const current = useAtomValue(currentLanguageAtom)
  return explicit || current || 'vi'
}

/* ---------- 底层加载 ---------- */
export function loadCourse(lang: string, stageId: string, themeId: string, file: string): CourseDetail {
  const langDir = LANG_DIR[lang] ?? lang
  const path = `/src/courses/${langDir}/${stageId}/${themeId}/${file}`
  let mod = courseModules[path]

  if (!mod) {
    const lowerPath = path.toLowerCase()
    const matchedKey = Object.keys(courseModules).find((k) => k.toLowerCase() === lowerPath)
    if (matchedKey) mod = courseModules[matchedKey]
  }

  if (!mod) {
    throw new Error(`找不到课程文件: ${path}。请检查文件名是否匹配 course_*.json`)
  }

  const course = mod.default as CourseDetail
  course.telex = course.telex || []
  course.grammar = course.grammar || []
  course.exercises = course.exercises || []
  return course
}

/* =====================================================
   阶段系统 API（默认当前语言，可显式覆盖）
   ===================================================== */
export function useStages(lang?: string): Stage[] {
  const l = useLang(lang)
  return useMemo(() => normalizeStages(l), [l])
}

export function useStage(stageId?: string, lang?: string): Stage | null {
  const l = useLang(lang)
  return useMemo(() => {
    if (!stageId) return null
    return normalizeStages(l).find((s) => s.id === stageId) || null
  }, [stageId, l])
}

export function useThemesByStage(stageId?: string, lang?: string): ThemeMeta[] {
  const l = useLang(lang)
  return useMemo(() => {
    if (!stageId) return []
    const stage = normalizeStages(l).find((s) => s.id === stageId)
    if (!stage) return []
    return stage.themes
      .map((tid) => themeEntries.find((e) => e.lang === l && e.meta.id === tid))
      .filter((e): e is ThemeEntry => !!e)
      .map((e) => e.meta)
  }, [stageId, l])
}

export function useTheme(themeId?: string, lang?: string): ThemeMeta | null {
  const l = useLang(lang)
  return useMemo(() => {
    if (!themeId) return null
    return themeEntries.find((e) => e.lang === l && e.meta.id === themeId)?.meta || null
  }, [themeId, l])
}

// ⬇️ 补上这个漏掉的函数（支持多语言）
export function useThemeCourses(themeId?: string, lang?: string): CourseMeta[] {
  const theme = useTheme(themeId, lang)
  return theme?.courses || []
}

/** 该语言全部主题（按 阶段→主题 顺序） */
export function useAllThemes(lang?: string): ThemeMeta[] {
  const l = useLang(lang)
  return useMemo(() => {
    const ordered: ThemeMeta[] = []
    for (const s of normalizeStages(l)) {
      for (const tid of s.themes) {
        const e = themeEntries.find((x) => x.lang === l && x.meta.id === tid)
        if (e) ordered.push(e.meta)
      }
    }
    return ordered
  }, [l])
}

/* =====================================================
   旧版兼容 API
   ===================================================== */
/** 旧用法：const { themes } = useCourseStructure(lang) */
export function useCourseStructure(lang?: string) {
  const themes = useAllThemes(lang)
  const l = useLang(lang)
  const stages = useMemo(() => normalizeStages(l), [l])
  return { themes, stages }
}

/** 旧用法：const { course, loading, error } = useCourse(lang, theme, no) */
export function useCourse(lang: string, themeId?: string, noOrId?: string) {
  return useMemo(() => {
    if (!themeId || !noOrId) {
      return { course: null, loading: false, error: '参数缺失' }
    }
    const theme = themeEntries.find((e) => e.lang === lang && e.meta.id === themeId)
    if (!theme) {
      return { course: null, loading: false, error: `主题不存在: ${themeId}` }
    }

    let meta = theme.meta.courses.find((c) => c.id === noOrId)
    if (!meta) {
      meta = theme.meta.courses.find((c) => {
        const m = c.file?.match(/course_(\d+)\.json/)
        return m && parseInt(m[1], 10) === parseInt(noOrId, 10)
      })
    }
    if (!meta || !meta.file) {
      return { course: null, loading: false, error: `课程不存在: ${noOrId}` }
    }

    try {
      const course = loadCourse(lang, theme.meta.stage || 'a1', themeId, meta.file)
      return { course, loading: false, error: null }
    } catch (e) {
      return { course: null, loading: false, error: (e as Error).message }
    }
  }, [lang, themeId, noOrId])
}

/** 旧用法：const { sentences } = useSentences(lang) */
export function useSentences(lang?: string) {
  const l = useLang(lang)
  return useMemo(() => ({ sentences: sentencesByLang[l] || [], loading: false }), [l])
}

/** 获取某语言下所有课程的完整详情（用于复习词池等，直接从内存读取，极速） */
export function getAllCoursesDetail(lang: string): CourseDetail[] {
  const langDir = LANG_DIR[lang] ?? lang
  const prefix = `/src/courses/${langDir}/`
  return Object.entries(courseModules)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, mod]) => {
      const c = mod.default as CourseDetail
      // 兜底防空
      c.words = c.words || []
      c.sentences = c.sentences || []
      c.grammar = c.grammar || []
      c.telex = c.telex || []
      c.exercises = c.exercises || []
      return c
    })
}
