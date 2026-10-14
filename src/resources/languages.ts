/**
 * ============================================================
 * 语言注册表 —— 全 App 语言相关数据的唯一来源
 * ============================================================
 * 加一门新语言：
 *   1. 在 LANGUAGE_REGISTRY 加一项
 *   2. 加词典（languageCategory 用同一个 code）
 *   3. 加课程（public/courses/index.json 用同一个 code 做 key）
 *      课程文件放 public/courses/{courseDir}/
 *   其他全部自动生效
 */

export interface LanguageMeta {
  /** 全局唯一代码：= 课程 index key = 词典 languageCategory */
  code: string
  /** 显示名 */
  label: string
  /** 图标 */
  icon: string
  /** 缩写（侧边栏收起时显示） */
  short: string
  /** 课程 JSON 所在子目录（public/courses/{courseDir}/） */
  courseDir: string
}

export const LANGUAGE_REGISTRY: LanguageMeta[] = [
  { code: 'vi', label: '越南语', icon: '🇻🇳', short: 'VI', courseDir: 'vietnamese' },
  { code: 'en', label: '英语', icon: '🇬🇧', short: 'EN', courseDir: 'english' },
  { code: 'ja', label: '日语', icon: '🇯🇵', short: 'JA', courseDir: 'japanese' },
]

export const DEFAULT_LANGUAGE = 'vi'

export function getLanguageMeta(code: string): LanguageMeta {
  return (
    LANGUAGE_REGISTRY.find((l) => l.code === code) ?? {
      code,
      label: code,
      icon: '🌐',
      short: code.toUpperCase().slice(0, 2),
      courseDir: code,
    }
  )
}

export function isKnownLanguage(code: string | undefined | null): boolean {
  if (!code) return false
  return LANGUAGE_REGISTRY.some((l) => l.code === code)
}
