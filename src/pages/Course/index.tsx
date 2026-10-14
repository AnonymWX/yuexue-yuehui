import { useCourseStructure } from './hooks/useCourse'
import { getLessonStatus, useAllLessonProgress } from './hooks/useLessonStatus'
import { getLanguageMeta } from '@/resources/languages'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { Link } from 'react-router-dom'

export default function CourseHomePage() {
  const currentLang = useAtomValue(currentLanguageAtom)
  const meta = getLanguageMeta(currentLang)
  const { themes, loading, error } = useCourseStructure(currentLang)
  const progressMap = useAllLessonProgress()

  if (loading) return <div className="p-8 text-center text-gray-400">加载中...</div>
  if (error) return <div className="p-8 text-center text-red-500">加载失败：{error}</div>

  const totalCourses = themes.reduce((acc, t) => acc + t.courses.length, 0)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold">{meta.label}课程</h1>
        <p className="text-sm text-gray-500">
          {meta.icon} 当前学习语言 · {totalCourses} 课
        </p>
      </div>

      {themes.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-subtle bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 text-4xl">📚</div>
          <div className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">{meta.label}暂无课程</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {themes.map((theme) => {
            const isEmpty = theme.courses.length === 0
            const finishedCount = theme.courses.filter((c) => getLessonStatus(c.id, progressMap) === 'finished').length

            const baseClass = 'flex flex-col items-start rounded-2xl border-2 bg-white p-5 text-left transition dark:bg-gray-900'

            const inner = (
              <>
                <div className="mb-1 font-semibold text-gray-800 dark:text-gray-100">{theme.title}</div>
                <div className="mb-3 text-sm text-gray-500">{theme.titleVi}</div>
                {isEmpty ? (
                  <span className="text-xs font-medium text-gray-400">敬请期待</span>
                ) : (
                  <span className="text-xs font-medium text-gray-500">
                    {theme.courses.length} 课 · 已学 {finishedCount}
                  </span>
                )}
              </>
            )

            if (isEmpty) {
              return (
                <div
                  key={theme.id}
                  className={`${baseClass} cursor-not-allowed border-dashed border-subtle opacity-70 dark:border-gray-700`}
                >
                  {inner}
                </div>
              )
            }

            return (
              <Link
                key={theme.id}
                to={`/course/${currentLang}/${theme.id}`}
                className={`${baseClass} border-subtle hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:hover:border-indigo-600`}
              >
                {inner}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
