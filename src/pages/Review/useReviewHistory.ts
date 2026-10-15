// src/pages/Review/useReviewHistory.ts
// 从 localStorage 归档聚合近 N 天复习量 + 计算连续打卡天数
import { useEffect, useState } from 'react'

export interface DayCount {
  date: string
  count: number
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const dailyKey = (lang: string) => `daily_review_v1_${lang}`
const historyKey = (lang: string) => `daily_review_history_v1_${lang}`

/** 把当天的记录同步到历史归档（每次挂载执行一次） */
function syncTodayToHistory(lang: string) {
  try {
    const raw = localStorage.getItem(dailyKey(lang))
    if (!raw) return
    const rec = JSON.parse(raw) as { date?: string; wordIds?: string[] }
    if (!rec.date || !Array.isArray(rec.wordIds)) return

    const hist: DayCount[] = JSON.parse(localStorage.getItem(historyKey(lang)) ?? '[]')
    const filtered = hist.filter((x) => x.date !== rec.date)
    filtered.push({ date: rec.date, count: rec.wordIds.length })
    filtered.sort((a, b) => a.date.localeCompare(b.date))
    localStorage.setItem(historyKey(lang), JSON.stringify(filtered))
  } catch {
    /* ignore */
  }
}

/** 拿到近 N 天数据与 streak */
export function useReviewHistory(lang: string, days = 30) {
  const [last30Days, setLast30Days] = useState<DayCount[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 先把今天的同步进归档
    syncTodayToHistory(lang)

    const hist: DayCount[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(historyKey(lang)) ?? '[]')
      } catch {
        return []
      }
    })()
    const map = new Map(hist.map((x) => [x.date, x.count]))

    const today = new Date()
    const series: DayCount[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      series.push({ date: key, count: map.get(key) ?? 0 })
    }

    // streak：从今天往前数，连续 count>0 的天数
    // 今天没做不算断（等今晚），从昨天开始算
    let s = 0
    for (let i = series.length - 1; i >= 0; i--) {
      const isToday = i === series.length - 1
      if (series[i].count > 0) {
        s++
      } else if (isToday) {
        continue // 今天还没做，跳过
      } else {
        break
      }
    }

    setLast30Days(series)
    setStreak(s)
    setLoading(false)
  }, [lang, days])

  return { last30Days, streak, loading }
}
