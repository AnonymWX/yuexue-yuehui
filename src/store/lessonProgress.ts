import { atom } from 'jotai'

export type LessonProgressEntry = {
  currentStep: number
  completed: number
  finished: boolean
  updatedAt: number
}

export type LessonProgressMap = Record<string, LessonProgressEntry>

/** 全局课程进度缓存（从云端拉取后放这里） */
export const lessonProgressAtom = atom<LessonProgressMap>({})

/** 是否已经从云端加载完成 */
export const lessonProgressLoadedAtom = atom<boolean>(false)
