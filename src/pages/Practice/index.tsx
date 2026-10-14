import { getGroups, skipAllDrills, usePracticeProgress, type DrillMode } from '@/pages/Drill/useDrillProgress'
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

const CARDS: ModeCard[] = [
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
]

export default function PracticePage() {
  const currentLang = useAtomValue(currentLanguageAtom)
  const { progress } = usePracticeProgress(currentLang)
  const location = useLocation()
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(location.state?.justLoggedIn === true)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const totalGroups = CARDS.reduce((sum, c) => sum + getGroups(c.mode).order.length, 0)
  const passedGroups = CARDS.reduce((sum, c) => {
    const { order } = getGroups(c.mode)
    const rec = progress[c.mode]
    if (!rec) return sum
    return sum + order.filter((g) => rec.groups[g]?.passed).length
  }, 0)
  const allPassed = passedGroups === totalGroups

  const handleSkipConfirm = () => {
    skipAllDrills(currentLang)
    setShowSkipConfirm(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold">基础练习</h1>
        <p className="text-gray-500">
          {allPassed ? '全部通过，学习功能已解锁 🎉' : `练熟声调和特殊字符后，学习会轻松很多 · 已完成 ${passedGroups} / ${totalGroups} 组`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => {
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
                'flex flex-col rounded-3xl border-2 p-6 transition ' +
                (cardAllPassed
                  ? 'border-green-300 bg-green-50/40 hover:border-green-400 dark:border-green-800 dark:bg-green-900/10'
                  : 'border-subtle bg-white hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600')
              }
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="text-4xl">{card.icon}</div>
                {cardAllPassed && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/40 dark:text-green-300">
                    ✓ 全部通过
                  </span>
                )}
              </div>

              <div className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">{card.title}</div>
              <div className="mb-3 text-xs text-gray-400">{card.subtitle}</div>
              <p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{card.desc}</p>

              <div className="mt-auto">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>
                    {passed} / {order.length} 组
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={'h-full rounded-full transition-all ' + (cardAllPassed ? 'bg-green-500' : 'bg-indigo-500')}
                    style={{ width: `${pct}%` }}
                  />
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
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl dark:bg-indigo-900/40">
              👋
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100">欢迎，{location.state?.user || ''}！</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              学习之前，先完成下面两项基础练习。练熟声调和特殊字符后，才能解锁课程、单词、复习等功能。
            </p>
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="shadow-primary-lg w-full rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(var(--primary-600))]"
            >
              开始练习
            </button>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-900/40">⚠️</div>
            <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-gray-100">确定跳过基础练习？</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              跳过之后，课程、单词、复习等功能会立即解锁。声调和特殊字符是越南语的基础，建议至少练一遍再跳过。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 rounded-2xl border-2 border-subtle px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                再练一下
              </button>
              <button
                type="button"
                onClick={handleSkipConfirm}
                className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                确定跳过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
