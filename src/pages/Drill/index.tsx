import {
  TARGET_PER_CHAR,
  clearGroupProgress,
  getGroupProgress,
  getGroups,
  isGroupUnlocked,
  markCharCorrect,
  usePracticeProgress,
  type DrillMode,
} from './useDrillProgress'
import { charToTelex } from '@/engines/telex/char-telex'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import IconVolume from '~icons/tabler/volume'

type FlashType = 'correct' | 'wrong' | null

function playVietnameseSound(text: string) {
  if (!text) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[Drill] speechSynthesis not supported')
    return
  }
  try {
    window.speechSynthesis.cancel()
  } catch {
    /* ignore */
  }
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'vi-VN'
  utter.rate = 0.9
  window.speechSynthesis.speak(utter)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ==================== 入口 ==================== */

export default function DrillPage() {
  const { mode, group } = useParams<{ mode: string; group?: string }>()
  const currentLang = useAtomValue(currentLanguageAtom)
  const drillMode: DrillMode = mode === 'tone' ? 'tone' : 'char'
  const { order, charMap } = useMemo(() => getGroups(drillMode), [drillMode])

  if (!group || !charMap[group]) {
    return <GroupSelect key={drillMode} lang={currentLang} mode={drillMode} order={order} charMap={charMap} />
  }
  if (!isGroupUnlocked(currentLang, drillMode, group)) {
    return <GroupSelect key={drillMode} lang={currentLang} mode={drillMode} order={order} charMap={charMap} />
  }
  return <QuizView key={`${drillMode}-${group}`} lang={currentLang} mode={drillMode} group={group} chars={charMap[group]} />
}

/* ==================== 组选择页 ==================== */

function GroupSelect({
  lang,
  mode,
  order,
  charMap,
}: {
  lang: string
  mode: DrillMode
  order: string[]
  charMap: Record<string, string[]>
}) {
  const navigate = useNavigate()
  const { progress } = usePracticeProgress(lang)

  const title = mode === 'tone' ? '声调专项训练' : '字符 → Telex 训练'
  const modeRec = progress[mode]
  const totalDone = modeRec ? order.filter((g) => modeRec.groups[g]?.passed).length : 0

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          ← 返回
        </button>
        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-200">{title}</h1>
        <div className="w-24" />
      </header>

      <p className="mb-8 text-center text-sm text-gray-500 dark:text-gray-400">
        依次解锁分组 · 每个字符答对 {TARGET_PER_CHAR} 次算掌握 · 已完成 {totalDone} / {order.length} 组
      </p>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-4 px-6 pb-12 sm:grid-cols-3">
        {order.map((g) => {
          const chars = charMap[g] ?? []
          const rec = modeRec?.groups[g]
          const passed = rec?.passed ?? false
          const charProgress = rec?.charProgress ?? {}
          const done = passed ? chars.length : chars.filter((c) => (charProgress[c] ?? 0) >= TARGET_PER_CHAR).length
          const unlocked = isGroupUnlocked(lang, mode, g)

          return (
            <button
              key={g}
              type="button"
              disabled={!unlocked}
              onClick={() => navigate(`/drill/${mode}/${g}`)}
              className={
                'group relative flex flex-col items-center justify-center rounded-3xl border-2 p-6 transition ' +
                (passed
                  ? 'border-green-300 bg-green-50 hover:border-green-400 dark:border-green-800 dark:bg-green-900/20'
                  : !unlocked
                  ? 'cursor-not-allowed border-subtle bg-gray-100 opacity-60 dark:border-gray-800 dark:bg-gray-800/40'
                  : 'border-subtle bg-white hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600')
              }
            >
              <div
                className={
                  'mb-2 text-4xl font-bold ' +
                  (passed
                    ? 'text-green-600 dark:text-green-400'
                    : unlocked
                    ? 'text-gray-800 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-600')
                }
              >
                {g}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {done} / {chars.length}
              </div>
              {passed && <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">✓ 已通过</div>}
              {!passed && !unlocked && <div className="mt-2 text-xs text-gray-400">🔒 待解锁</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ==================== 答题页 ==================== */

function QuizView({ lang, mode, group, chars }: { lang: string; mode: DrillMode; group: string; chars: string[] }) {
  const navigate = useNavigate()
  const { refresh } = usePracticeProgress(lang)

  const [counts, setCounts] = useState<Record<string, number>>(() => getGroupProgress(lang, mode, group))

  const [queue, setQueue] = useState<string[]>(() => {
    const initial = getGroupProgress(lang, mode, group)
    const remaining = chars.filter((c) => (initial[c] ?? 0) < TARGET_PER_CHAR)
    return shuffle(remaining)
  })

  const [typed, setTyped] = useState('')
  const [wrongCount, setWrongCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [flash, setFlash] = useState<FlashType>(null)
  const [showHint, setShowHint] = useState(false)

  const passed = queue.length === 0
  const currentChar = queue[0] ?? ''
  const expected = currentChar ? charToTelex(currentChar) : ''
  const currentCharRef = useRef(currentChar)
  currentCharRef.current = currentChar

  useEffect(() => {
    if (!currentChar || passed) return
    const t = setTimeout(() => playVietnameseSound(currentChar), 150)
    return () => clearTimeout(t)
  }, [currentChar, passed])

  useEffect(() => {
    if (passed) refresh()
  }, [passed, refresh])

  useEffect(() => {
    if (passed) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        if (e.ctrlKey && e.key.toLowerCase() === 'j') {
          e.preventDefault()
          playVietnameseSound(currentCharRef.current)
        }
        return
      }
      if (e.isComposing || e.keyCode === 229) return

      if (e.key === 'Escape') {
        e.preventDefault()
        navigate(`/drill/${mode}`)
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        setTyped((t) => t.slice(0, -1))
        return
      }

      if (e.key.length !== 1) return

      e.preventDefault()
      const newTyped = typed + e.key
      const lower = newTyped.toLowerCase()
      const expectedLower = expected.toLowerCase()

      if (!expectedLower.startsWith(lower)) {
        setWrongCount((w) => w + 1)
        setFlash('wrong')
        setQueue((q) => (q.length <= 1 ? q : [...q.slice(1), q[0]]))
        setTimeout(() => {
          setTyped('')
          setFlash(null)
        }, 350)
        return
      }

      setTyped(newTyped)

      if (lower === expectedLower) {
        const newCount = (counts[currentChar] ?? 0) + 1
        setCorrectCount((c) => c + 1)
        setFlash('correct')
        setCounts((prev) => ({ ...prev, [currentChar]: newCount }))
        markCharCorrect(lang, mode, group, currentChar)

        setTimeout(() => {
          setTyped('')
          setFlash(null)
          setQueue((q) => {
            if (q.length === 0) return q
            if (newCount >= TARGET_PER_CHAR) return q.slice(1)
            return q.length <= 1 ? q : [...q.slice(1), q[0]]
          })
        }, 350)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [typed, expected, navigate, passed, counts, currentChar, lang, mode, group])

  const handleSkip = useCallback(() => {
    if (passed) return
    setWrongCount((w) => w + 1)
    setTyped('')
    setQueue((q) => (q.length <= 1 ? q : [...q.slice(1), q[0]]))
  }, [passed])

  const handleRestart = useCallback(() => {
    clearGroupProgress(lang, mode, group)
    setCounts({})
    setCorrectCount(0)
    setWrongCount(0)
    setTyped('')
    setFlash(null)
    setQueue(shuffle(chars))
  }, [lang, mode, group, chars])

  // ==================== 通过页 ====================
  if (passed) {
    const { order } = getGroups(mode)
    const idx = order.indexOf(group)
    const nextGroup = order[idx + 1]
    const isLastInMode = !nextGroup
    const modeTitle = mode === 'tone' ? '声调训练' : '字符训练'

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl text-green-500 dark:bg-green-900/30">
          ✓
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-100">{group} 组通过！</h1>
        <p className="mb-2 text-gray-500 dark:text-gray-400">
          {modeTitle} · 本轮答对 {correctCount} 次 · 错误 {wrongCount} 次
        </p>
        <p className="mb-10 text-sm text-gray-400 dark:text-gray-500">
          {isLastInMode
            ? mode === 'tone'
              ? '声调全部完成，去练字符吧'
              : '字符全部完成，开始正式学习吧 🎉'
            : `本组字符都答对 ${TARGET_PER_CHAR} 次了`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/drill/${mode}`)}
            className="rounded-2xl border-2 border-subtle bg-white px-6 py-3 font-bold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            返回分组
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-2xl border-2 border-subtle bg-white px-6 py-3 font-bold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            重练本组
          </button>
          {nextGroup && (
            <button
              type="button"
              onClick={() => navigate(`/drill/${mode}/${nextGroup}`)}
              className="shadow-primary-lg rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(var(--primary-600))]"
            >
              下一组：{nextGroup} →
            </button>
          )}
          {isLastInMode && mode === 'tone' && (
            <button
              type="button"
              onClick={() => navigate('/drill/char')}
              className="shadow-primary-lg rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(var(--primary-600))]"
            >
              继续：字符训练 →
            </button>
          )}
          {isLastInMode && mode === 'char' && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="shadow-primary-lg rounded-2xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(var(--primary-600))]"
            >
              开始学习 →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ==================== 答题界面 ====================
  const total = correctCount + wrongCount
  const accuracy = total === 0 ? 100 : Math.round((correctCount / total) * 100)
  const doneChars = chars.filter((c) => (counts[c] ?? 0) >= TARGET_PER_CHAR).length
  const progressPct = chars.length === 0 ? 0 : Math.round((doneChars / chars.length) * 100)
  const modeTitle = mode === 'tone' ? '声调训练' : '字符训练'

  return (
    <div lang="vi" className="flex min-h-screen flex-col bg-page">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => navigate(`/drill/${mode}`)}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          ← 分组（Esc）
        </button>
        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-200">
          {modeTitle} · {group} 组
        </h1>
        <div className="w-24" />
      </header>

      <div className="flex items-center justify-center gap-8 py-2 text-sm text-gray-500 dark:text-gray-400">
        <div>
          正确 <span className="ml-1 font-mono text-green-500">{correctCount}</span>
        </div>
        <div>
          错误 <span className="ml-1 font-mono text-red-500">{wrongCount}</span>
        </div>
        <div>
          正确率 <span className="ml-1 font-mono text-indigo-500">{accuracy}%</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl px-6 pt-2">
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          <span>
            本组掌握 {doneChars} / {chars.length}
          </span>
          <span>每个答对 {TARGET_PER_CHAR} 次</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div
            className={`select-none transition-colors duration-150 ${
              flash === 'correct' ? 'text-green-500' : flash === 'wrong' ? 'text-red-500' : 'text-black dark:text-white'
            }`}
            style={{ fontSize: '12rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '0.02em' }}
          >
            {currentChar || '_'}
          </div>
          <button
            type="button"
            onClick={() => playVietnameseSound(currentChar)}
            className="absolute -right-20 top-1/2 -translate-y-1/2 rounded-full bg-indigo-500 p-3 text-white transition-all hover:scale-110 hover:bg-indigo-400"
            title="播放发音（Ctrl+J）"
          >
            <IconVolume className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-12 flex h-12 items-center text-3xl text-gray-500 dark:text-gray-400">
          <span className="mr-3 text-base text-gray-400 dark:text-gray-500">你输入：</span>
          <span
            className="border-b-2 border-gray-400 px-3 pb-1 font-mono dark:border-gray-500"
            style={{ minWidth: '80px', minHeight: '2.5rem' }}
          >
            {typed || '\u00A0'}
          </span>
        </div>

        <div className="mt-6 h-10">
          {showHint && expected && (
            <div className="rounded-lg bg-indigo-100 px-5 py-2 font-mono text-2xl font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              {expected}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 py-8">
        <button
          type="button"
          onClick={() => playVietnameseSound(currentChar)}
          className="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400"
        >
          🔊 播放发音
        </button>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          className="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400"
        >
          {showHint ? '隐藏提示' : '显示提示'}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-lg bg-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          跳过（算错）
        </button>
      </div>
    </div>
  )
}
