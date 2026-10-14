import { useTheme } from './hooks/useCourse'
import { getLessonStatus, useAllLessonProgress } from './hooks/useLessonStatus'
import { Link, useParams } from 'react-router-dom'

const STATUS_STYLE = {
  finished: {
    bar: 'bg-emerald-500',
    badge: 'text-emerald-600 dark:text-emerald-400',
    label: '✓ 已学完',
  },
  learning: {
    bar: 'bg-indigo-500',
    badge: 'text-indigo-600 dark:text-indigo-400',
    label: '▶ 学习中',
  },
  new: {
    bar: 'bg-gray-200 dark:bg-gray-700',
    badge: 'text-gray-400 dark:text-gray-500',
    label: '未学',
  },
} as const

function extractNo(file: string): string {
  const m = file.match(/course_(\d+)\.json/)
  return m ? m[1] : '01'
}

export default function LanguageCourseList() {
  const { lang, theme: themeId } = useParams()
  const { theme, loading, error } = useTheme(lang, themeId)
  const progressMap = useAllLessonProgress()

  if (loading) return <div className="p-8 text-center text-gray-400">加载中...</div>
  if (error) return <div className="p-8 text-center text-red-500">加载失败：{error}</div>
  if (!theme || !lang) return null

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/course" className="mb-4 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        ← 返回主题
      </Link>

      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold">{theme.title}</h1>
        <p className="text-sm text-gray-500">
          {theme.titleVi} · {theme.courses.length} 课
        </p>
      </div>

      {theme.courses.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-subtle bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 text-4xl">📚</div>
          <div className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">此主题课程制作中</div>
          <p className="text-sm text-gray-400">敬请期待。</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {theme.courses.map((c) => {
            const status = getLessonStatus(c.id, progressMap)
            const style = STATUS_STYLE[status]
            const no = extractNo(c.file)
            return (
              <li key={c.id}>
                <Link
                  to={`/course/${lang}/${theme.id}/${no}`}
                  className="flex items-stretch gap-4 overflow-hidden rounded-2xl border-2 border-subtle bg-white p-5 transition hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
                >
                  <span className={`w-1 shrink-0 rounded-full ${style.bar}`} />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <div className="mb-1 font-semibold text-gray-800 dark:text-gray-100">{c.title}</div>
                      {c.titleVi && <div className="text-sm text-gray-500">{c.titleVi}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {c.level && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {c.level}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${style.badge}`}>{style.label}</span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
