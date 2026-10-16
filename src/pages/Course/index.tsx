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

  const stageStats = useMemo(() => {
    const allCourses = allThemes.flatMap((t) => t.courses.map((c) => ({ id: c.id, stageId: t.stage })))
    const order = ['a1', 'a2', 'b1', 'c1']
    const sortedStages = [...stages].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

    let prevStageFinishedAll = true
    return sortedStages.map((stage) => {
      const stageCourses = allCourses.filter((c) => c.stageId === stage.id)
      const total = stageCourses.length
      const finished = stageCourses.filter((c) => progressMap[c.id]?.finished).length
      const isUnlocked = total === 0 ? true : prevStageFinishedAll

      if (total > 0) {
        prevStageFinishedAll = finished >= total
      }
      return { ...stage, total, finished, unlocked: isUnlocked }
    })
  }, [stages, allThemes, progressMap])

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="mb-2 text-2xl font-bold text-primary md:text-3xl">选择学习阶段</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 md:mb-8 md:text-base">选择学习阶段 · Choose your CEFR level</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {stageStats.map((stage) => (
          <div
            key={stage.id}
            onClick={() => stage.unlocked && navigate(`/course/${stage.id}`)}
            className={`group relative rounded-xl border border-subtle bg-page p-5 transition-all md:p-6 ${
              stage.unlocked
                ? 'cursor-pointer shadow-primary/30 hover:-translate-y-1 hover:shadow-primary'
                : 'cursor-not-allowed opacity-60 grayscale'
            }`}
          >
            {!stage.unlocked && <div className="absolute right-4 top-4 text-2xl">🔒</div>}
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`text-2xl font-extrabold md:text-3xl ${stage.unlocked ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {stage.cefr}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs md:text-sm ${
                  stage.unlocked ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {stage.unlocked ? `${stage.themes.length} 个主题` : '未解锁'}
              </span>
            </div>
            <h2
              className={`mb-1 text-lg font-semibold md:text-xl ${
                stage.unlocked ? 'transition-colors group-hover:text-primary' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {stage.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stage.titleVi}</p>

            <div className="mt-4 border-t border-subtle pt-3">
              {stage.unlocked ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
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
