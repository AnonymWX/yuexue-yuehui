import { HANGUL_GROUP_ORDER, HANGUL_CHAR_MAP } from '@/engines/beolsik/characters'
import { KANA_GROUP_ORDER, KANA_CHAR_MAP } from '@/engines/romaji/characters'
import { CHAR_GROUPS } from '@/engines/telex/characters'
import { fetchPracticeProgress, upsertPracticeProgress } from '@/lib/db'
import { userIdAtom } from '@/pages/Login/useAuth'
import { currentLanguageAtom } from '@/store/language'
import {
  emptyPracticeProgress,
  practiceProgressAtom,
  practiceProgressLoadedAtom,
  type DrillMode,
  type GroupRecord,
  type ModeRecord,
  type PracticeProgress,
} from '@/store/practiceProgress'
import { getDefaultStore, useAtomValue } from 'jotai'
import { useCallback, useEffect } from 'react'

// ============================================
// 存储 key
// ============================================

const STORAGE_PREFIX = 'practice_progress_v1_'
const LAST_USER_KEY = 'practice_progress_last_user'

function storageKey(lang: string): string {
  return `${STORAGE_PREFIX}${lang}`
}

export type { DrillMode, GroupRecord, ModeRecord, PracticeProgress } from '@/store/practiceProgress'

const jotaiStore = getDefaultStore()

/** 每个字符需答对的次数才算掌握 */
export const TARGET_PER_CHAR = 2

/** 声调专项：6 个基础元音 × 6 种声调 */
export const TONE_GROUPS: Record<string, string[]> = {
  a: ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  e: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  i: ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  o: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  u: ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  y: ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
}

export const TONE_GROUP_ORDER = ['a', 'e', 'i', 'o', 'u', 'y']

export const CHAR_GROUP_ORDER = ['a', 'e', 'i', 'o', 'u', 'y', 'd']

export function getGroups(lang: string, mode: DrillMode): { order: string[]; charMap: Record<string, string[]> } {
  if (mode === 'tone') {
    return { order: [...TONE_GROUP_ORDER], charMap: TONE_GROUPS }
  }
  if (mode === 'char') {
    return { order: [...CHAR_GROUP_ORDER], charMap: CHAR_GROUPS }
  }
  if (mode === 'kana') {
    return { order: [...KANA_GROUP_ORDER], charMap: KANA_CHAR_MAP }
  }
  if (mode === 'hangul') {
    return { order: [...HANGUL_GROUP_ORDER], charMap: HANGUL_CHAR_MAP }
  }
  return { order: [], charMap: {} }
}

// ============================================
// 本地读写（按语言分 key）
// ============================================

export function readProgress(lang: string): PracticeProgress {
  try {
    const raw = localStorage.getItem(storageKey(lang))
    if (!raw) return emptyPracticeProgress()
    const parsed = JSON.parse(raw) as PracticeProgress
    if (!parsed || typeof parsed !== 'object') return emptyPracticeProgress()
    return parsed
  } catch {
    return emptyPracticeProgress()
  }
}

function writeProgress(lang: string, p: PracticeProgress) {
  // 1. 写本地
  try {
    localStorage.setItem(storageKey(lang), JSON.stringify(p))
  } catch {
    /* ignore */
  }
  // 2. 更新 atom
  jotaiStore.set(practiceProgressAtom, p)
  // 3. 异步推云端
  const userId = jotaiStore.get(userIdAtom)
  if (userId) {
    pushToCloud(userId, p).catch((e) => console.error('[practice] 云端同步失败', e))
  }
}

async function pushToCloud(userId: string, p: PracticeProgress) {
  // 只推对象里实际存在的 mode
  await Promise.all(Object.keys(p).map((mode) => upsertPracticeProgress(userId, mode, p[mode])))
}

// ============================================
// 语言 → 练习 配置
// ============================================

/** 不需要练习的语言（黑名单），其他语言一律要有练习页 */
export const LANGS_WITHOUT_PRACTICE: string[] = ['en']

/** 该语言是否需要练习页 */
export function hasPracticeForLang(lang: string): boolean {
  return !LANGS_WITHOUT_PRACTICE.includes(lang)
}

/**
 * 每种语言需要的练习模式。
 * - 未配置的语言 → 视为「暂无练习模式」，恒放行
 * - 已配置的语言 → 检查对应 mode 是否全部 passed
 */
export const PRACTICE_MODES_BY_LANG: Record<string, DrillMode[]> = {
  vi: ['tone', 'char'],
  ja: ['kana'],
  ko: ['hangul'],
}

/** 该语言的练习门槛是否已通过 */
export function isUnlockedForLang(lang: string): boolean {
  if (!hasPracticeForLang(lang)) return true
  const modes = PRACTICE_MODES_BY_LANG[lang]
  if (!modes || modes.length === 0) return true
  const p = readProgress(lang)
  return modes.every((m) => {
    const rec = p[m]
    if (!rec) return false
    const { order } = getGroups(lang, m)
    return order.every((g) => rec.groups[g]?.passed)
  })
}

// ============================================
// 单 mode 查询
// ============================================

export function getGroupProgress(lang: string, mode: DrillMode, group: string): Record<string, number> {
  const p = readProgress(lang)
  return p[mode]?.groups[group]?.charProgress ?? {}
}

export function isGroupPassed(lang: string, mode: DrillMode, group: string): boolean {
  const p = readProgress(lang)
  return p[mode]?.groups[group]?.passed ?? false
}

export function isGroupUnlocked(lang: string, mode: DrillMode, group: string): boolean {
  const { order } = getGroups(lang, mode)
  const idx = order.indexOf(group)
  if (idx <= 0) return true
  const p = readProgress(lang)
  for (let i = 0; i < idx; i++) {
    if (!p[mode]?.groups[order[i]]?.passed) return false
  }
  return true
}

export function isModePassed(lang: string, mode: DrillMode): boolean {
  const p = readProgress(lang)
  const { order } = getGroups(lang, mode)
  const rec = p[mode]
  if (!rec) return false
  return order.every((g) => rec.groups[g]?.passed)
}

// ============================================
// 写入
// ============================================

export function markCharCorrect(lang: string, mode: DrillMode, group: string, char: string): void {
  const p = readProgress(lang)
  const modeRec: ModeRecord = p[mode] ?? { groups: {} }
  const grp: GroupRecord = modeRec.groups[group] ?? { passed: false, charProgress: {} }
  const cur = grp.charProgress[char] ?? 0
  grp.charProgress[char] = cur + 1

  const { charMap } = getGroups(lang, mode)
  const groupChars = charMap[group] ?? []
  const allDone = groupChars.length > 0 && groupChars.every((c) => (grp.charProgress[c] ?? 0) >= TARGET_PER_CHAR)
  grp.passed = grp.passed || allDone

  modeRec.groups[group] = grp
  p[mode] = modeRec
  writeProgress(lang, p)
}

export function clearGroupProgress(lang: string, mode: DrillMode, group: string): void {
  const p = readProgress(lang)
  const rec = p[mode]?.groups[group]
  if (rec) {
    rec.charProgress = {}
    writeProgress(lang, p)
  }
}

/** 跳过当前语言的所有练习 */
export function skipAllDrills(lang: string): void {
  const p = emptyPracticeProgress()
  const modes = PRACTICE_MODES_BY_LANG[lang] ?? []
  for (const mode of modes) {
    const { order } = getGroups(lang, mode)
    p[mode] = { groups: {} }
    for (const group of order) {
      p[mode].groups[group] = { passed: true, charProgress: {} }
    }
  }
  writeProgress(lang, p)
}

// ============================================
// Hooks
// ============================================

/** UI 从 atom 读，实时响应。lang 变化时 refresh 会从对应 key 重读 */
export function usePracticeProgress(lang: string) {
  const progress = useAtomValue(practiceProgressAtom)
  const loaded = useAtomValue(practiceProgressLoadedAtom)
  const refresh = useCallback(() => {
    jotaiStore.set(practiceProgressAtom, readProgress(lang))
  }, [lang])
  return { progress, loaded, refresh }
}

/**
 * 全局初始化：在 Root 里调用一次。
 * userId 或语言变化时重新同步。
 *
 * 关键逻辑：
 * - 同一账号 + 同一语言刷新 → 保留本地，先灌 atom，再从云端拉最新覆盖
 * - 切换账号 → 清所有语言的本地缓存，从云端拉
 * - 切换语言 → 只重新加载当前语言（不动其他语言）
 * - 登出 → 清内存
 */
export function usePracticeProgressInit() {
  const userId = useAtomValue(userIdAtom)
  const lang = useAtomValue(currentLanguageAtom)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const lastUser = localStorage.getItem(LAST_USER_KEY)
      const currentUser = userId ?? ''

      const isFirstRun = lastUser === null
      const isRealSwitch = lastUser !== null && lastUser !== '' && currentUser !== '' && lastUser !== currentUser

      // 记录当前用户
      if (currentUser !== '' && currentUser !== lastUser) {
        try {
          localStorage.setItem(LAST_USER_KEY, currentUser)
        } catch {
          /* ignore */
        }
      }

      // 真切账号 → 清所有语言的本地进度
      if (isRealSwitch) {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k)
          })
        } catch {
          /* ignore */
        }
      }

      // 登出：清内存
      if (!userId) {
        if (!cancelled) {
          jotaiStore.set(practiceProgressAtom, emptyPracticeProgress())
          jotaiStore.set(practiceProgressLoadedAtom, true)
        }
        return
      }

      // 同账号刷新：先把本地缓存灌进 atom
      if (isFirstRun || !isRealSwitch) {
        jotaiStore.set(practiceProgressAtom, readProgress(lang))
      }

      // 从云端拉当前语言的 mode
      jotaiStore.set(practiceProgressLoadedAtom, false)
      const modes = PRACTICE_MODES_BY_LANG[lang] ?? []
      try {
        const rows = await Promise.all(modes.map((m) => fetchPracticeProgress(userId, m)))
        if (cancelled) return
        const cloud: PracticeProgress = {}
        modes.forEach((m, i) => {
          const row = rows[i]
          cloud[m] = (row?.data as ModeRecord) ?? { groups: {} }
        })
        jotaiStore.set(practiceProgressAtom, cloud)
        try {
          localStorage.setItem(storageKey(lang), JSON.stringify(cloud))
        } catch {
          /* ignore */
        }
      } catch (e) {
        console.error('[practice] 云端加载失败', e)
      } finally {
        if (!cancelled) jotaiStore.set(practiceProgressLoadedAtom, true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, lang])
}
