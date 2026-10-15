// src/pages/Course/hooks/useLessonStatus.ts
import { lessonProgressAtom } from '@/store/lessonProgress'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

export type LessonStatus = 'locked' | 'unlocked' | 'in-progress' | 'done'

/**
 * 获取课程状态的 Hook
 * @returns (courseId: string) => LessonStatus
 */
export function useLessonStatus() {
  const progressMap = useAtomValue(lessonProgressAtom)

  return useMemo(() => {
    return (courseId: string): LessonStatus => {
      if (!courseId) return 'locked'

      const progress = progressMap[courseId]

      if (!progress) {
        // 没有进度记录 → 未开始（已解锁）
        return 'unlocked'
      }

      if (progress.finished) {
        // 已完成
        return 'done'
      }

      // 有记录但未完成 → 进行中
      return 'in-progress'
    }
  }, [progressMap])
}

/**
 * 辅助 Hook：判断某门课是否已完成
 */
export function useIsCourseDone(courseId: string): boolean {
  const getStatus = useLessonStatus()
  return getStatus(courseId) === 'done'
}

/**
 * 辅助 Hook：获取课程进度百分比
 */
export function useLessonProgress(courseId: string): number {
  const progressMap = useAtomValue(lessonProgressAtom)
  const progress = progressMap[courseId]

  if (!progress) return 0
  if (progress.finished) return 100

  // 假设每课有 8 步（根据 jindu.md 的 8 步流程）
  const totalSteps = 8
  const percentage = Math.round((progress.currentStep / totalSteps) * 100)
  return Math.min(percentage, 99) // 未完成时最多显示 99%
}
