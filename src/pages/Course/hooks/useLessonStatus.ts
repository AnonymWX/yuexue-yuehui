import { lessonProgressAtom, type LessonProgressMap } from '@/store/lessonProgress'
import { useAtomValue } from 'jotai'

export type LessonStatus = 'finished' | 'learning' | 'new'

export type { LessonProgressEntry, LessonProgressMap } from '@/store/lessonProgress'

export function getLessonStatus(courseId: string, map: LessonProgressMap): LessonStatus {
  const p = map[courseId]
  if (!p) return 'new'
  if (p.finished) return 'finished'
  if (p.completed > 0 || p.currentStep > 0) return 'learning'
  return 'new'
}

/** 读全局进度 atom */
export function useAllLessonProgress(): LessonProgressMap {
  return useAtomValue(lessonProgressAtom)
}
