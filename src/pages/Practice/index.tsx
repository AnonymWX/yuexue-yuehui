import InputHint from '@/components/InputHint'
import { getGroups, skipAllDrills, usePracticeProgress, type DrillMode, hasPracticeForLang } from '@/pages/Drill/useDrillProgress'
import { getLanguageMeta } from '@/resources/languages'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface ModeCard {
  mode: DrillMode
  to: string
  icon: string
  title: string
  subtitle: string
  desc: string
}

const CARDS_BY_LANG: Record<string, ModeCard[]> = {
  vi: [
    {
      mode: 'tone',
      to: '/drill/tone',
      icon: '🎵',
      title: '声调专项训练',
      subtitle: '6 组 · 36 个声调字符',
      desc: '先熟悉越南语的 5 种声调 + 无声调，每个字符答对 2 次算掌握',
    },
    {
      mode: 'char',
      to: '/drill/char',
      icon: '🔤',
      title: '字符 → Telex 训练',
      subtitle: '7 组 · 75 个特殊字符',
      desc: '含 ă â ê ô ơ ư đ 等所有越南语变音，练到条件反射',
    },
  ],
}

export default function PracticePage() {
  const currentLang = useAtomValue(currentLanguageAtom)
  const meta = getLanguageMeta(currentLang)
  const { progress } = usePracticeProgress(currentLang)
  const location = useLocation()
  const navigate = useNavigate()

  const [showWelcome, setShowWelcome] = useState(location.state?.justLoggedIn === true)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const needsPractice = hasPracticeForLang(currentLang)
  const cards = CARDS_BY_LANG[currentLang] || []
  const practiceReady = cards.length > 0

  /* ===== 态 1：无需练习（英语） ===== */
  if (!needsPractice) {
    return (
      <div className="container mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-6xl dark:bg-indigo-900/30">
          🎉
        </div>
        <h1 className="mb-3 text-3xl font-bold">{meta.label} 无需基础练习</h1>
        <p className="mb-8 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          该语言没有强制的练习门槛，您可以直接前往「课程」开始学习！
        </p>
        <button
          type="button"
          onClick={() => navigate('/course')}
          className="rounded-2xl bg-indigo-500 px-8 py-3 text-lg font-bold text-white shadow-primary transition hover:brightness-95 active:translate-y-[2px]"
        >
          去学习课程 →
        </button>

        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="shadow-primary-lg w-full max-w-md rounded-3xl bg-page p-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl dark:bg-indigo-900/40">
                👋
              </div>
              <h2 className="mb-2 text-xl font-bold">欢迎，{location.state?.user || ''}！</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {meta.label} 无需基础练习，请直接开始您的学习之旅。
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowWelcome(false)
                  navigate('/course')
                }}
                className="w-full rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white shadow-primary transition hover:brightness-95"
              >
                开始学习
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ===== 态 2：需要练习但内容未开发（ja/ko 过渡） ===== */
  if (!practiceReady) {
    return (
      <div className="container mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-6xl dark:bg-indigo-900/30">
          🛠️
        </div>
        <h1 className="mb-3 text-3xl font-bold">{meta.label} 练习开发中</h1>
        <p className="mb-8 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          该语言的基础练习正在制作中，完成后需通过练习才能解锁学习功能；现阶段暂时直接放行。
        </p>
        <button
          type="button"
          onClick={() => navigate('/course')}
          className="rounded-2xl bg-indigo-500 px-8 py-3 text-lg font-bold text-white shadow-primary transition hover:brightness-95 active:translate-y-[2px]"
        >
          暂时直接进入课程 →
        </button>
      </div>
    )
  }

  /* ===== 态 3：需要练习且内容已开发（越南语） ===== */
  const totalGroups = cards.reduce((sum, c) => sum + getGroups(c.mode).order.length, 0)
  const passedGroups = cards.reduce((sum, c) => {
    const { order } = getGroups(c.mode)
    const rec = progress[c.mode]
    if (!rec) return sum
    return sum + order.filter((g) => rec.groups[g]?.passed).length
  }, 0)
  const allPassed = passedGroups === totalGroups
  const totalPct = totalGroups === 0 ? 0 : Math.round((passedGroups / totalGroups) * 100)

  const handleSkipConfirm = () => {
    skipAllDrills(currentLang)
    setShowSkipConfirm(false)
    navigate('/', { replace: true })
  }

  return (
    <>
      <InputHint />
      <div className="container mx-auto max-w-4xl px-6 py-10">
        {/* 头部：标题 + 总进度 */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 text-3xl font-bold">{meta.label} · 基础练习</h1>
            <p className="text-gray-500 dark:text-gray-400">{allPassed ? '全部通过，学习功能已解锁 🎉' : '练熟基础后，学习会轻松很多'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              已完成 <span className="text-2xl font-bold text-indigo-500">{passedGroups}</span> / {totalGroups} 组
            </div>
            <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${totalPct}%` }} />
            </div>
          </div>
        </div>

        {/* 全部通过庆祝条 */}
        {allPassed && (
          <div className="mb-6 flex items-center gap-4 rounded-3xl border-2 border-indigo-200 bg-indigo-50/60 p-5 shadow-primary dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-2xl text-white">🎉</div>
            <div>
              <div className="font-bold text-indigo-600 dark:text-indigo-300">恭喜！基础练习全部通过</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">课程、单词、复习等功能已全部解锁，开始你的学习之旅吧</div>
            </div>
          </div>
        )}

        {/* 练习卡片 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((card) => {
            const { order } = getGroups(card.mode)
            const modeRec = progress[card.mode]
            const passed = modeRec ? order.filter((g) => modeRec.groups[g]?.passed).length : 0
            const cardAllPassed = passed === order.length
            const pct = order.length === 0 ? 0 : Math.round((passed / order.length) * 100)

            return (
              <Link
                key={card.mode}
                to={card.to}
                className={
                  'group flex flex-col rounded-3xl border-2 p-6 transition-all hover:-translate-y-1 ' +
                  (cardAllPassed
                    ? 'border-indigo-300 bg-indigo-50/50 shadow-primary hover:border-indigo-400 dark:border-indigo-700 dark:bg-indigo-900/10'
                    : 'hover:shadow-primary-lg border-subtle bg-page shadow-primary hover:border-indigo-400 dark:hover:border-indigo-600')
                }
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl dark:bg-indigo-900/30">
                    {card.icon}
                  </div>
                  {cardAllPassed && (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                      ✓ 全部通过
                    </span>
                  )}
                </div>

                <div className="mb-1 text-lg font-semibold group-hover:text-indigo-500">{card.title}</div>
                <div className="mb-3 text-xs text-gray-400 dark:text-gray-500">{card.subtitle}</div>
                <p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{card.desc}</p>

                <div className="mt-auto">
                  <div className="mb-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>
                      {passed} / {order.length} 组
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {!allPassed && (
          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={() => setShowSkipConfirm(true)}
              className="text-xs text-gray-300 underline-offset-4 transition hover:text-gray-500 hover:underline dark:text-gray-600 dark:hover:text-gray-400"
            >
              已知晓，跳过练习
            </button>
          </div>
        )}

        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="shadow-primary-lg w-full max-w-md rounded-3xl bg-page p-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl dark:bg-indigo-900/40">
                👋
              </div>
              <h2 className="mb-2 text-xl font-bold">欢迎，{location.state?.user || ''}！</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                学习之前，先完成下面的基础练习。练熟后，才能解锁课程、单词、复习等功能。
              </p>
              <button
                type="button"
                onClick={() => setShowWelcome(false)}
                className="w-full rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white shadow-primary transition hover:brightness-95 active:translate-y-[3px]"
              >
                开始练习
              </button>
            </div>
          </div>
        )}

        {showSkipConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="shadow-primary-lg w-full max-w-md rounded-3xl bg-page p-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-900/40">
                ⚠️
              </div>
              <h2 className="mb-2 text-xl font-bold">确定跳过基础练习？</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                跳过之后，课程、单词、复习等功能会立即解锁。建议至少练一遍再跳过。
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSkipConfirm(false)}
                  className="flex-1 rounded-2xl border-2 border-subtle px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  再练一下
                </button>
                <button
                  type="button"
                  onClick={handleSkipConfirm}
                  className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-primary transition hover:bg-amber-600"
                >
                  确定跳过
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
