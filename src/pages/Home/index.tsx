import useSpeech from '@/hooks/useSpeech'
import { useAllThemes, useStages } from '@/pages/Course/hooks/useCourse'
import { useDailyReview } from '@/pages/Review/useDailyReview'
import { useReviewHistory } from '@/pages/Review/useReviewHistory'
import { getLanguageMeta } from '@/resources/languages'
import { currentLanguageAtom } from '@/store/language'
import { lessonProgressAtom } from '@/store/lessonProgress'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// 多语言每日一句配置
const DAILY_QUOTES = {
  vi: { text: 'Có công mài sắt, có ngày nên kim.', zh: '有铁杵磨成针的毅力，终会成功。' },
  ja: { text: '七転び八起き。', zh: '七跌八起，永不言弃。' },
  ko: { text: '천리길도 한 걸음부터.', zh: '千里之行，始于足下。' },
  en: { text: 'Practice makes perfect.', zh: '熟能生巧。' },
}

export default function HomePage() {
  const navigate = useNavigate()
  const currentLang = useAtomValue(currentLanguageAtom)
  const meta = getLanguageMeta(currentLang)

  // 1. 获取所有主题 & 阶段列表
  const allThemes = useAllThemes()
  const stages = useStages() // ⭐ 新增：获取阶段元数据 (A1/A2)
  const progressMap = useAtomValue(lessonProgressAtom)
  const { streak } = useReviewHistory(currentLang)

  // 2. 扁平化所有课程
  const viCourses = useMemo(() => {
    return allThemes.flatMap((t) =>
      t.courses.map((c, idx) => ({
        id: c.id,
        title: c.title,
        titleVi: c.titleVi,
        level: c.level,
        theme: t.id,
        themeTitle: t.title,
        stageId: t.stage,
        themeSeq: idx + 1,
      })),
    )
  }, [allThemes])

  // 3. 继续学习逻辑
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

  // 4. 每日复习逻辑
  const { state: reviewState, loading: reviewLoading, hasEnough } = useDailyReview(currentLang)
  const reviewDone = reviewState?.done ?? 0
  const reviewTotal = reviewState?.total ?? 10
  const reviewFinished = hasEnough && reviewDone >= reviewTotal
  const reviewPct = hasEnough ? Math.round((reviewDone / reviewTotal) * 100) : 0

  // 5. 统计数据计算
  const finishedCoursesCount = useMemo(() => Object.values(progressMap).filter((p) => p.finished).length, [progressMap])

  // 6. 每日一句
  const quote = DAILY_QUOTES[currentLang as keyof typeof DAILY_QUOTES] || DAILY_QUOTES.en
  const { speak, speaking } = useSpeech(quote.text)

  // ⭐ 7. 智能问候语 (根据时间段 + 打卡天数)
  const greetingText = useMemo(() => {
    const hour = new Date().getHours()
    let base = '欢迎回来'
    if (hour >= 5 && hour < 12) base = '早安，新的一天从学习开始'
    else if (hour >= 12 && hour < 18) base = '下午好，保持专注'
    else if (hour >= 18 && hour < 24) base = '晚上好，睡前巩固一下'
    else base = '夜深了，注意休息哦'

    if (streak >= 30) return `${base}，连续打卡 ${streak} 天，你是大师 👑`
    if (streak > 0) return `${base}，已连续打卡 ${streak} 天 🔥`
    return base
  }, [streak])

  // ⭐ 8. 阶段解锁逻辑 (A1 学完才解锁 A2)
  const currentStageInfo = useMemo(() => {
    if (stages.length === 0) return null

    // 计算每个阶段的进度
    const stageStats = stages.map((stage) => {
      // 找到属于该阶段的所有课程
      const stageCourses = viCourses.filter((c) => c.stageId === stage.id)
      const total = stageCourses.length
      const finished = stageCourses.filter((c) => progressMap[c.id]?.finished).length
      return { ...stage, total, finished }
    })

    // 按阶段顺序排序 (a1 -> a2 -> b1)
    const order = ['a1', 'a2', 'b1', 'c1']
    stageStats.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

    // 寻找当前解锁的阶段
    let unlockedStage = stageStats[0] // 默认解锁第一个
    for (let i = 0; i < stageStats.length; i++) {
      const s = stageStats[i]
      if (s.finished < s.total) {
        unlockedStage = s // 当前阶段没学完，就显示它
        break
      }
      // 如果当前学完了，且还有下一个阶段，则解锁下一个
      if (i + 1 < stageStats.length) {
        unlockedStage = stageStats[i + 1]
      }
    }

    return unlockedStage
  }, [stages, viCourses, progressMap])

  // 9. 快捷入口配置
  const quickActions = [
    { icon: '📚', title: '全部课程', desc: '浏览所有阶段与主题', link: '/course' },
    { icon: '📊', title: '学习统计', desc: '查看正确率与错词本', link: '/review/stats' },
    {
      icon: currentLang === 'en' ? '🌍' : '📝',
      title: currentLang === 'en' ? '切换语言' : '专项练习',
      desc: currentLang === 'en' ? '设置你的学习目标' : '声调 / 假名 / 字母训练',
      link: currentLang === 'en' ? '/' : '/practice', // ⬅️ 已修正：从 /drill 改为 /practice
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* ================= 1. 头部欢迎区 (动态问候) ================= */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-primary">{greetingText} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {meta.icon} 当前学习：{meta.label}
        </p>
      </div>

      {/* ================= 2. 数据看板 (Stats Row) ================= */}
      <section className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-subtle bg-page p-4 text-center shadow-primary/10 transition-all hover:shadow-primary/30">
          <div className="text-2xl font-bold text-primary">{streak || 0}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">🔥 连续打卡 (天)</div>
        </div>
        <div className="rounded-xl border border-subtle bg-page p-4 text-center shadow-primary/10 transition-all hover:shadow-primary/30">
          <div className="text-2xl font-bold text-primary">{finishedCoursesCount}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">📚 已完成课程</div>
        </div>

        {/* ⭐ 阶段进度卡片 (动态解锁) */}
        <div className="rounded-xl border border-subtle bg-page p-4 text-center shadow-primary/10 transition-all hover:shadow-primary/30">
          {currentStageInfo ? (
            <>
              <div className="text-2xl font-bold text-primary">
                {currentStageInfo.finished === currentStageInfo.total && currentStageInfo.id === stages[stages.length - 1]?.id
                  ? '🏆'
                  : currentStageInfo.cefr || currentStageInfo.id.toUpperCase()}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {currentStageInfo.finished === currentStageInfo.total && currentStageInfo.id === stages[stages.length - 1]?.id
                  ? '全部通关'
                  : `当前阶段 (${currentStageInfo.finished}/${currentStageInfo.total})`}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">暂无阶段数据</div>
            </>
          )}
        </div>
      </section>

      {/* ================= 3. 继续学习区块 ================= */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-primary">继续学习</h2>
        {continueCourse ? (
          <Link
            to={`/course/${continueCourse.stageId}/${continueCourse.theme}/${continueCourse.id}`}
            className="group block rounded-xl border border-subtle bg-page p-6 shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-primary dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {meta.label} · {continueCourse.themeTitle} · {continueCourse.level ?? 'A1'}
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {continueCourse.themeTitle} · 第 {continueCourse.themeSeq} 课
              </span>
            </div>
            <div className="mb-1 text-lg font-semibold transition-colors group-hover:text-primary">{continueCourse.title}</div>
            {continueCourse.titleVi && <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">{continueCourse.titleVi}</div>}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">第 {step + 1} / 8 步</span>
              <span className="font-medium text-primary transition-transform group-hover:translate-x-1">继续 →</span>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-subtle bg-page p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 text-4xl">🚀</div>
            <div className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
              {viCourses.length === 0 ? `准备开始学习 ${meta.label} 吗？` : '太棒了！已学完全部现有课程'}
            </div>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {viCourses.length === 0 ? '从基础阶段开始，建立你的语言学习体系' : '新的主题和课程正在加紧制作中，敬请期待'}
            </p>
            <Link
              to="/course"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {viCourses.length === 0 ? '浏览全部课程' : '查看学习统计'}
            </Link>
          </div>
        )}
      </section>

      {/* ================= 4. 今天的练习区块 ================= */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-primary">今天的练习</h2>
        {currentLang === 'vi' ? (
          <button
            type="button"
            onClick={() => navigate('/review')}
            className="group block w-full rounded-xl border border-subtle bg-page p-6 text-left shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-primary dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">今日复习 · 10 词</div>
              {reviewFinished && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  已完成 ✅
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-primary">
              {reviewLoading
                ? '—'
                : !hasEnough
                ? '未开始'
                : reviewFinished
                ? `${reviewTotal} / ${reviewTotal}`
                : `${reviewDone} / ${reviewTotal}`}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${reviewPct}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{!hasEnough && !reviewLoading ? '学完至少一课再来' : reviewFinished ? '明天再来' : '随机抽 10 个学过的词'}</span>
              <span className="font-medium text-primary transition-transform group-hover:translate-x-1">进入 →</span>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-subtle bg-page p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-3xl">🎯</div>
            <div className="mb-1 text-base font-medium text-gray-700 dark:text-gray-200">该语言暂无每日复习功能</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">SM-2 记忆曲线复习目前仅支持越南语，快去「专项练习」巩固基础吧！</p>
          </div>
        )}
      </section>

      {/* ================= 5. 快捷入口网格 ================= */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-primary">快捷入口</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className="group flex flex-col rounded-xl border border-subtle bg-page p-5 shadow-primary/10 transition-all hover:-translate-y-1 hover:shadow-primary/30 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-3 text-2xl">{action.icon}</div>
              <div className="text-base font-semibold text-gray-800 transition-colors group-hover:text-primary dark:text-gray-200">
                {action.title}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{action.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= 6. 每日一句 ================= */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">每日一句</h2>
        <div className="relative rounded-xl border border-subtle bg-page p-6 shadow-primary/10 dark:border-gray-700 dark:bg-gray-900">
          <div className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-primary/30" />

          <div className="pl-4">
            <p className="mb-2 text-lg font-medium italic text-gray-800 dark:text-gray-200">"{quote.text}"</p>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{quote.zh}</p>
            <button
              onClick={() => speak()}
              className="flex items-center gap-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              title={speaking ? '停止朗读' : '朗读'}
            >
              <span>{speaking ? '⏹️' : ''}</span>
              {speaking ? '停止朗读' : '点击朗读'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
