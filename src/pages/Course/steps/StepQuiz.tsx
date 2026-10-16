import TelexFillInput, { isSentenceMatch } from './TelexFillInput'
import { currentLanguageAtom } from '@/store/language'
import type { CourseExercise } from '@/typings/course'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

interface Props {
  exercises: CourseExercise[]
  onNext: () => void
}

type QState = 'idle' | 'correct' | 'wrong'

export default function StepQuiz({ exercises, onNext }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [states, setStates] = useState<Record<number, QState>>({})
  const [hints, setHints] = useState<Record<number, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (exercises.length === 0) onNext()
  }, [exercises.length, onNext])

  if (exercises.length === 0) return null

  const setAnswer = (i: number, v: string) => {
    setAnswers((a) => ({ ...a, [i]: v }))
    setStates((s) => ({ ...s, [i]: 'idle' }))
  }

  const checkOne = (i: number) => {
    const ex = exercises[i]
    const raw = answers[i] ?? ''
    if (!raw.trim()) return
    let ok = false
    if (ex.type === 'choose') {
      ok = raw.trim() === ex.answer.trim()
    } else if (ex.type === 'telex_input') {
      ok = isSentenceMatch(ex.answer, raw)
    } else {
      // fill：越南语走 Telex 判定；其他语言普通文本比对
      if (lang === 'vi') ok = isSentenceMatch(ex.answer, raw)
      else ok = raw.trim().toLowerCase() === ex.answer.trim().toLowerCase()
    }
    setStates((s) => ({ ...s, [i]: ok ? 'correct' : 'wrong' }))
  }

  const handleChoose = (i: number, opt: string) => {
    if (states[i] === 'correct') return
    const ex = exercises[i]
    setAnswers((a) => ({ ...a, [i]: opt }))
    const ok = opt === ex.answer
    setStates((s) => ({ ...s, [i]: ok ? 'correct' : 'wrong' }))
  }

  const score = exercises.filter((_, i) => states[i] === 'correct').length
  const allCorrect = score === exercises.length

  const handleSubmit = () => {
    if (!allCorrect) return
    setSubmitted(true)
    setTimeout(() => onNext(), 1500)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="mb-2 text-2xl font-bold">复习测试</h2>
      <p className="mb-8 text-sm text-gray-500">把本课学到的单词、句子、语法都用一遍。</p>

      <div className="space-y-4">
        {exercises.map((ex, i) => {
          const raw = answers[i] ?? ''
          const state = states[i] ?? 'idle'
          const hintShown = hints[i] ?? false

          return (
            <div key={i} className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-400">{i + 1}.</span>
                  <span className="text-base font-medium">{ex.question ?? '请输入：'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHints((h) => ({ ...h, [i]: !h[i] }))}
                  className="shrink-0 text-xs text-blue-500 hover:underline"
                >
                  {hintShown ? '隐藏提示' : '提示'}
                </button>
              </div>

              {hintShown && (
                <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  答案：{ex.answer}
                </div>
              )}

              {ex.type === 'choose' && ex.options ? (
                <div className="space-y-2">
                  {ex.options.map((opt) => {
                    const picked = raw === opt
                    let cls = 'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition '
                    if (picked && state === 'correct') {
                      cls += 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    } else if (picked && state === 'wrong') {
                      cls += 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    } else {
                      cls += 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }
                    return (
                      <div key={opt} className={cls} onClick={() => handleChoose(i, opt)}>
                        <span className="text-base">{opt}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    {lang === 'vi' ? (
                      <TelexFillInput
                        target={ex.answer}
                        value={raw}
                        onChange={(v) => setAnswer(i, v)}
                        onEnter={() => checkOne(i)}
                        disabled={state === 'correct' || submitted}
                        autoFocus={i === 0}
                      />
                    ) : (
                      <input
                        type="text"
                        value={raw}
                        onChange={(e) => setAnswer(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') checkOne(i)
                        }}
                        disabled={state === 'correct' || submitted}
                        autoFocus={i === 0}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        className={
                          'w-full rounded-2xl border bg-white px-4 py-3 text-lg outline-none transition disabled:opacity-60 dark:bg-gray-800 ' +
                          (state === 'correct'
                            ? 'border-green-400 focus:border-green-500 dark:border-green-800'
                            : state === 'wrong'
                            ? 'border-red-400 focus:border-red-500 dark:border-red-800'
                            : 'border-gray-200 focus:border-indigo-500 dark:border-gray-700')
                        }
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => checkOne(i)}
                    disabled={state === 'correct' || !raw.trim() || submitted}
                    className="shrink-0 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800"
                  >
                    检查
                  </button>
                </div>
              )}

              {state === 'correct' && <div className="mt-3 text-sm text-green-600">✅ 正确</div>}
              {state === 'wrong' && <div className="mt-3 text-sm text-red-500">❌ 不对，再试一次</div>}
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={!allCorrect}
          onClick={handleSubmit}
          className={
            'mt-8 w-full rounded-2xl px-6 py-4 text-base font-semibold transition ' +
            (allCorrect
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-[0.98]'
              : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600')
          }
        >
          {allCorrect ? '提交' : `还有 ${exercises.length - score} 题未答对`}
        </button>
      ) : (
        <div className="mt-8 rounded-2xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
          <div className="text-sm text-gray-500">全部正确！</div>
        </div>
      )}
    </div>
  )
}
