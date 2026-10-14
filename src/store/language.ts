import { DEFAULT_LANGUAGE, isKnownLanguage } from '@/resources/languages'
import { atom } from 'jotai'

const STORAGE_KEY = 'app_language_v1'

function readInitial(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && isKnownLanguage(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE
}

/** 全局当前语言 */
export const currentLanguageAtom = atom<string>(readInitial())

/** 写入 + 持久化 */
export const setLanguageAtom = atom(null, (_get, set, code: string) => {
  set(currentLanguageAtom, code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
})
