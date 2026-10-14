import { atom } from 'jotai'

export type ThemeCode = 'a' | 'b' | 'c' | 'd'

export interface ThemeMeta {
  code: ThemeCode
  name: string
  icon: string
  desc: string
}

export const THEME_REGISTRY: ThemeMeta[] = [
  { code: 'a', name: '越', icon: '🌿', desc: '橄榄绿 · 默认' },
  { code: 'b', name: '竹', icon: '🎋', desc: '青绿 · 清新' },
  { code: 'c', name: '莲', icon: '🌸', desc: '玫红 · 柔和' },
  { code: 'd', name: '夜', icon: '🌙', desc: '浅紫 · 暗色' },
]

export function isKnownTheme(code: string): code is ThemeCode {
  return THEME_REGISTRY.some((t) => t.code === code)
}

export function getThemeMeta(code: string): ThemeMeta {
  return THEME_REGISTRY.find((t) => t.code === code) ?? THEME_REGISTRY[0]
}

export function isDarkTheme(code: string): boolean {
  return code === 'd'
}

const STORAGE_KEY = 'app_theme_v1'
const DEFAULT_THEME: ThemeCode = 'a'

function readInitial(): ThemeCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && isKnownTheme(v)) return v
    // 兼容旧的暗色偏好
    if (localStorage.getItem('isOpenDarkModeAtom') === 'true') return 'd'
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

/** 全局当前主题 */
export const themeAtom = atom<ThemeCode>(readInitial())

/** 写入 + 持久化 */
export const setThemeAtom = atom(null, (_get, set, code: ThemeCode) => {
  set(themeAtom, code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
})
