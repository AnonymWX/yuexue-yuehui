import { atom } from 'jotai'

export type DrillMode = 'tone' | 'char'

export interface GroupRecord {
  passed: boolean
  charProgress: Record<string, number>
}

export interface ModeRecord {
  groups: Record<string, GroupRecord>
}

/**
 * 练习进度：mode 字符串 → ModeRecord
 *
 * 每种语言的 mode 集合不同，见 useDrillProgress.ts 的 PRACTICE_MODES_BY_LANG
 * - 越南语：tone / char
 * - 日语（将来）：kana
 * - 韩语（将来）：hangul
 */
export type PracticeProgress = Record<string, ModeRecord>

export function emptyPracticeProgress(): PracticeProgress {
  return {}
}

/** 全局练习进度缓存（UI 从这里读，实时刷新） */
export const practiceProgressAtom = atom<PracticeProgress>(emptyPracticeProgress())

/** 是否已从云端加载完成 */
export const practiceProgressLoadedAtom = atom<boolean>(false)
