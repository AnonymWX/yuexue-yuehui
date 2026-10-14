import { clearLessonProgress, fetchAllLessonProgress, upsertLessonProgress } from '@/lib/db'
import { userIdAtom } from '@/pages/Login/useAuth'
import { lessonProgressAtom, lessonProgressLoadedAtom, type LessonProgressEntry, type LessonProgressMap } from '@/store/lessonProgress'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'

export type LessonProgress = LessonProgressEntry

/**
 * 全局初始化：在 Root 组件里调用一次。
 * userId 变化时（登录/登出/切账号）重新拉取云端进度。
 */
export function useLessonProgressInit() {
  const userId = useAtomValue(userIdAtom)
  const setMap = useSetAtom(lessonProgressAtom)
  const setLoaded = useSetAtom(lessonProgressLoadedAtom)

  useEffect(() => {
    if (!userId) {
      setMap({})
      setLoaded(true)
      return
    }
    setLoaded(false)
    fetchAllLessonProgress(userId)
      .then((rows) => {
        const map: LessonProgressMap = {}
        for (const r of rows) {
          map[r.course_id] = {
            currentStep: r.current_step,
            completed: r.completed,
            finished: r.finished,
            updatedAt: new Date(r.updated_at).getTime(),
          }
        }
        setMap(map)
        setLoaded(true)
      })
      .catch((e) => {
        console.error('[lessonProgress] 加载失败', e)
        setLoaded(true)
      })
  }, [userId, setMap, setLoaded])
}

/**
 * 单课进度读写。
 * - progress：从全局 atom 里取，同步返回
 * - save/clear：异步写云端，但会立即做乐观更新（本地 atom 先改）
 */
export function useLessonProgress(courseId: string) {
  const userId = useAtomValue(userIdAtom)
  const map = useAtomValue(lessonProgressAtom)
  const setMap = useSetAtom(lessonProgressAtom)
  const loaded = useAtomValue(lessonProgressLoadedAtom)

  const progress = map[courseId] ?? null

  const save = useCallback(
    async (step: number, finished: boolean) => {
      if (!userId) return
      const entry: LessonProgressEntry = {
        currentStep: step,
        completed: step,
        finished,
        updatedAt: Date.now(),
      }
      // 乐观更新：本地立即生效
      setMap((old) => ({ ...old, [courseId]: entry }))
      // 后台写云端
      try {
        await upsertLessonProgress(userId, courseId, step, finished)
      } catch (e) {
        console.error('[lessonProgress] 保存失败', e)
      }
    },
    [userId, courseId, setMap],
  )

  const clear = useCallback(async () => {
    if (!userId) return
    setMap((old) => {
      const next = { ...old }
      delete next[courseId]
      return next
    })
    try {
      await clearLessonProgress(userId, courseId)
    } catch (e) {
      console.error('[lessonProgress] 清除失败', e)
    }
  }, [userId, courseId, setMap])

  return { progress, loaded, save, clear }
}
