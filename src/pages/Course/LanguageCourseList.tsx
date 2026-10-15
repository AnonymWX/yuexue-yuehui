// src/pages/Course/LanguageCourseList.tsx
import { useStage, useTheme, useThemeCourses } from './hooks/useCourse'
import { useLessonStatus, type LessonStatus } from './hooks/useLessonStatus'
import { lessonProgressAtom } from '@/store/lessonProgress'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const TOTAL_STEPS = 8

export default function LanguageCourseList() {
  const { stage: stageId, theme: themeId } = useParams<{
    stage: string
    theme: string
  }>()
  const navigate = useNavigate()
  const stage = useStage(stageId)
  const theme = useTheme(themeId)
  const courses = useThemeCourses(themeId)
  const getStatus = useLessonStatus()
  const progressMap = useAtomValue(lessonProgressAtom)

  const doneCount = useMemo(() => courses.filter((c) => getStatus(c.id) === 'done').length, [courses, getStatus])

  if (!stage || !theme) {
    return (
      <div className="p-6 text-center text-gray-500">
        主题未找到
        <br />
        <button onClick={() => navigate(`/course/${stageId}`)} className="mt-4 text-indigo-500 hover:underline">
          ← 返回阶段
        </button>
      </div>
    )
  }

  const themePct = courses.length ? Math.round((doneCount / courses.length) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl p-6">
      <button onClick={() => navigate(`/course/${stageId}`)} className="mb-4 text-sm text-indigo-500 hover:underline">
        ← 返回 {stage.title}
      </button>

      {/* ===== 主题头部：标题 + 总进度 ===== */}
      <div className="mb-6 rounded-3xl border border-subtle bg-page p-6 shadow-primary">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{theme.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{theme.titleVi}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              已完成 <span className="text-lg font-bold text-indigo-500">{doneCount}</span> / {courses.length} 课
            </div>
            <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${themePct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 课程列表 ===== */}
      <div className="space-y-3">
        {courses.map((course, index) => {
          const status = getStatus(course.id)
          const progress = progressMap[course.id]
          const step = progress?.currentStep ?? 0
          const stepPct = Math.min(Math.round((step / TOTAL_STEPS) * 100), 99)

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => navigate(`/course/${stageId}/${themeId}/${course.id}`)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-subtle bg-page p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-primary dark:hover:border-indigo-700"
            >
              {/* 左侧状态圆标 */}
              <StatusCircle status={status} index={index} />

              {/* 中间信息 */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400">第 {index + 1} 课</span>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {course.level}
                  </span>
                </div>
                <h3 className="mt-1 truncate font-semibold transition-colors group-hover:text-indigo-500">{course.title}</h3>
                <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{course.titleVi}</p>

                {/* 学习中：进度条 */}
                {status === 'in-progress' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${stepPct}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-amber-500">
                      第 {Math.min(step + 1, TOTAL_STEPS)} / {TOTAL_STEPS} 步
                    </span>
                  </div>
                )}
              </div>

              {/* 右侧状态胶囊 + 箭头 */}
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {status === 'done' && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                    已完成
                  </span>
                )}
                {status === 'in-progress' && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                    学习中
                  </span>
                )}
                {status === 'unlocked' && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    未开始
                  </span>
                )}
                <span className="text-indigo-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500">→</span>
              </div>
            </button>
          )
        })}
      </div>

      {courses.length === 0 && <div className="py-20 text-center text-gray-400">该主题暂无课程</div>}
    </div>
  )
}

/* ===== 左侧状态圆标 ===== */
function StatusCircle({ status, index }: { status: LessonStatus; index: number }) {
  // 已完成：实心绿圆 + 白勾
  if (status === 'done') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-sm">
        ✓
      </div>
    )
  }
  // 学习中：琥珀描边圆 + 课号
  if (status === 'in-progress') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-500 dark:bg-amber-900/30 dark:text-amber-300">
        {index + 1}
      </div>
    )
  }
  // 未开始：灰色虚线圆 + 课号
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-sm font-medium text-gray-400 dark:border-gray-600 dark:text-gray-500">
      {index + 1}
    </div>
  )
}
