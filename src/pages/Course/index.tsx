import { useStages, useAllThemes } from './hooks/useCourse'
import { lessonProgressAtom } from '@/store/lessonProgress'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CourseIndex() {
  const navigate = useNavigate()
  const stages = useStages()
  const allThemes = useAllThemes()
  const progressMap = useAtomValue(lessonProgressAtom)

  // ⭐ 计算每个阶段的进度与解锁状态
  const stageStats = useMemo(() => {
    // 1. 扁平化所有课程，提取 id 和 stageId
    const allCourses = allThemes.flatMap((t) => t.courses.map((c) => ({ id: c.id, stageId: t.stage })))

    // 2. 按 CEFR 级别排序 (a1 -> a2 -> b1 -> c1)
    const order = ['a1', 'a2', 'b1', 'c1']
    const sortedStages = [...stages].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

    // 3. 遍历计算：前一个阶段全学完，当前阶段才解锁
    let prevStageFinishedAll = true

    return sortedStages.map((stage) => {
      const stageCourses = allCourses.filter((c) => c.stageId === stage.id)
      const total = stageCourses.length
      const finished = stageCourses.filter((c) => progressMap[c.id]?.finished).length

      // 如果该阶段没课，视为解锁（避免空阶段卡死后续）
      const isUnlocked = total === 0 ? true : prevStageFinishedAll

      // 为下一个阶段准备条件：当前阶段必须学完（且当前阶段有课）
      if (total > 0) {
        prevStageFinishedAll = finished >= total
      }

      return { ...stage, total, finished, unlocked: isUnlocked }
    })
  }, [stages, allThemes, progressMap])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">选择学习阶段</h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">选择学习阶段 · Choose your CEFR level</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {stageStats.map((stage) => (
          <div
            key={stage.id}
            // ⭐ 未解锁时阻止点击跳转
            onClick={() => stage.unlocked && navigate(`/course/${stage.id}`)}
            className={`group relative rounded-xl border border-subtle bg-page p-6 transition-all ${
              stage.unlocked
                ? 'cursor-pointer shadow-primary/30 hover:-translate-y-1 hover:shadow-primary'
                : 'cursor-not-allowed opacity-60 grayscale' // 未解锁样式：半透明、灰度、禁止鼠标
            }`}
          >
            {/* ⭐ 未解锁时的锁图标 */}
            {!stage.unlocked && <div className="absolute right-4 top-4 text-2xl">🔒</div>}

            <div className="mb-3 flex items-center justify-between">
              <span className={`text-3xl font-extrabold ${stage.unlocked ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
                {stage.cefr}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  stage.unlocked ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {stage.unlocked ? `${stage.themes.length} 个主题` : '未解锁'}
              </span>
            </div>

            <h2
              className={`mb-1 text-xl font-semibold ${
                stage.unlocked ? 'transition-colors group-hover:text-primary' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {stage.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stage.titleVi}</p>

            {/* ⭐ 底部进度提示区 */}
            <div className="mt-4 border-t border-subtle pt-3">
              {stage.unlocked ? (
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{stage.total > 0 ? `学习进度: ${stage.finished} / ${stage.total} 课` : '暂无课程数据'}</span>
                  {stage.total > 0 && stage.finished === stage.total ? (
                    <span className="font-medium text-green-500">已通关 ✅</span>
                  ) : (
                    <span className="font-medium text-primary transition-transform group-hover:translate-x-1">点击进入 →</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500">🔒 需完成上一阶段全部课程后解锁</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {stageStats.length === 0 && <div className="py-20 text-center text-gray-400">暂无阶段数据，请检查 public/courses/index.json</div>}
    </div>
  )
}
