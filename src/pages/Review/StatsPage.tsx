import { useReviewHistory } from './useReviewHistory'
import { getAllCoursesDetail } from '@/pages/Course/hooks/useCourse'
import { currentLanguageAtom } from '@/store/language'
import { computeLocalSummary, wordReviewStatsAtom } from '@/store/wordReviewStats'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

export default function StatsPage() {
  const stats = useAtomValue(wordReviewStatsAtom)
  const lang = useAtomValue(currentLanguageAtom)
  const summary = useMemo(() => computeLocalSummary(stats), [stats])
  const { last30Days, streak, loading } = useReviewHistory(lang, 30)

  // wordId → 词信息（用于错词 Top10 显示）
  const wordMap = useMemo(() => {
    const m = new Map<string, { name: string; trans: string[] }>()
    try {
      const courses = getAllCoursesDetail(lang)
      for (const c of courses) {
        for (const w of c.words ?? []) {
          if (w.id && w.name) m.set(w.id, { name: w.name, trans: w.trans ?? [] })
        }
      }
    } catch {
      /* ignore */
    }
    return m
  }, [lang])

  const maxCount = Math.max(1, ...last30Days.map((d) => d.count))

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">复习统计</h1>
        <Link to="/review" className="text-sm text-indigo-600 hover:underline">
          ← 返回每日复习
        </Link>
      </header>

      {/* 概览卡片 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="总复习次数" value={summary.totalReviewed} />
        <StatCard label="正确率" value={`${(summary.accuracy * 100).toFixed(1)}%`} />
        <StatCard label="连续打卡" value={`${loading ? '…' : streak} 天`} />
        <StatCard label="今日到期" value={summary.dueToday} />
      </section>

      {/* 近 30 天柱状图 */}
      <section>
        <h2 className="mb-3 text-lg font-medium">近 30 天复习量</h2>
        <div className="flex h-32 items-end gap-1 border-b border-gray-200 dark:border-gray-700">
          {last30Days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}：${d.count} 词`}
              className="flex-1 rounded-t bg-indigo-500/70 transition-colors hover:bg-indigo-500"
              style={{
                height: `${(d.count / maxCount) * 100}%`,
                minHeight: d.count > 0 ? 4 : 0,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>{last30Days[0]?.date}</span>
          <span>{last30Days[last30Days.length - 1]?.date}</span>
        </div>
      </section>

      {/* 错词 Top 10 */}
      <section>
        <h2 className="mb-3 text-lg font-medium">错词 Top 10</h2>
        {summary.topWrong.length === 0 ? (
          <p className="text-sm text-gray-500">暂无错词，保持！</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {summary.topWrong.map((w, i) => {
              const info = wordMap.get(w.wordId)
              return (
                <li key={w.wordId} className="flex items-center justify-between px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {i + 1}. {info?.name ?? w.wordId}
                    </span>
                    {info?.trans?.length ? <span className="text-xs text-gray-500">{info.trans.join('；')}</span> : null}
                  </div>
                  <span className="whitespace-nowrap text-sm text-red-500">
                    错 {w.wrongCount} 次 · Lv {w.level}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}
