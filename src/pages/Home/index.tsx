import { useCourseStructure } from '@/pages/Course/hooks/useCourse'
import { useAllLessonProgress } from '@/pages/Course/hooks/useLessonStatus'
import { useDailyReview } from '@/pages/Review/useDailyReview'
import { getLanguageMeta } from '@/resources/languages'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  const currentLang = useAtomValue(currentLanguageAtom)
  const meta = getLanguageMeta(currentLang)
  const { themes } = useCourseStructure(currentLang)
  const progressMap = useAllLessonProgress()

  // 按主题顺序扁平化所有课程
  const viCourses = useMemo(() => {
    return themes.flatMap((t) =>
      t.courses.map((c, idx) => {
        const m = c.file.match(/course_(\d+)\.json/)
        return {
          id: c.id,
          title: c.title,
          titleVi: c.titleVi,
          level: c.level,
          theme: t.id,
          themeTitle: t.title,
          no: m ? m[1] : '01',
          themeSeq: idx + 1,
        }
      }),
    )
  }, [themes])

  // 继续学习：优先取「有进度、未完成、updatedAt 最新」的那课
  const continueCourse = useMemo(() => {
    let best: (typeof viCourses)[number] | null = null
    let bestTime = 0
    for (const c of viCourses) {
      const p = progressMap[c.id]
      if (!p || p.finished) continue
      if (p.updatedAt > bestTime) {
        bestTime = p.updatedAt
        best = c
      }
    }
    if (best) return best
    for (const c of viCourses) {
      if (!progressMap[c.id]) return c
    }
    return null
  }, [viCourses, progressMap])

  const step = continueCourse ? progressMap[continueCourse.id]?.currentStep ?? 0 : 0

  const { state: reviewState, loading: reviewLoading, hasEnough } = useDailyReview(currentLang)
  const reviewDone = reviewState?.done ?? 0
  const reviewTotal = reviewState?.total ?? 10
  const reviewFinished = hasEnough && reviewDone >= reviewTotal
  const reviewPct = hasEnough ? Math.round((reviewDone / reviewTotal) * 100) : 0

  const isVi = currentLang === 'vi'

  return (
    <div className="container mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold">欢迎回来 👋</h1>
        <p className="text-gray-500">
          {meta.icon} 当前学习：{meta.label}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">继续学习</h2>
        {continueCourse ? (
          <Link
            to={`/course/${currentLang}/${continueCourse.theme}/${continueCourse.no}`}
            className="block rounded-3xl border-2 border-gray-200 bg-white p-6 transition hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {meta.label} · {continueCourse.themeTitle} · {continueCourse.level ?? 'A1'}
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                {continueCourse.themeTitle} · 第 {continueCourse.themeSeq} 课
              </span>
            </div>
            <div className="mb-3 text-lg font-semibold">{continueCourse.title}</div>
            {continueCourse.titleVi && <div className="text-sm text-gray-500">{continueCourse.titleVi}</div>}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-400">第 {step + 1} / 8 步</span>
              <span className="text-indigo-500">继续 →</span>
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-3xl">📚</div>
            <div className="mb-1 text-base font-medium text-gray-700 dark:text-gray-200">
              {viCourses.length === 0 ? `${meta.label}暂无课程` : '已学完全部课程'}
            </div>
            <p className="text-sm text-gray-400">{viCourses.length === 0 ? '去「单词」或「练习」熟悉一下基础吧' : '下一课即将上线'}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">今天的练习</h2>

        {isVi ? (
          <button
            type="button"
            onClick={() => navigate('/review')}
            className="block w-full rounded-3xl border-2 border-gray-200 bg-white p-6 text-left transition hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">今日复习 · 10 词</div>
              {reviewFinished && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-300">
                  已完成 ✅
                </span>
              )}
            </div>

            <div className="text-2xl font-bold">
              {reviewLoading
                ? '—'
                : !hasEnough
                ? '未开始'
                : reviewFinished
                ? `${reviewTotal} / ${reviewTotal}`
                : `${reviewDone} / ${reviewTotal}`}
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${reviewPct}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>{!hasEnough && !reviewLoading ? '学完至少一课再来' : reviewFinished ? '明天再来' : '随机抽 10 个学过的词'}</span>
              <span className="text-indigo-500">进入 →</span>
            </div>
          </button>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-3xl">🎯</div>
            <div className="mb-1 text-base font-medium text-gray-700 dark:text-gray-200">该语言暂无复习功能</div>
            <p className="text-sm text-gray-400">复习功能目前仅支持越南语</p>
          </div>
        )}
      </section>
    </div>
  )
}
