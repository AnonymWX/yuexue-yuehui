import type { ReviewWord } from './useDailyReview'
import { useMemo, useState } from 'react'

interface Props {
  word: ReviewWord
  pool: ReviewWord[]
  onDone: () => void
  onWrong?: (wordId: string) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ReviewChoiceCard({ word, pool, onDone, onWrong }: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [wrongId, setWrongId] = useState<string | null>(null)

  const options = useMemo(() => {
    const others = pool.filter((w) => w.id !== word.id)
    const distractors = shuffle(others).slice(0, 3)
    return shuffle([word, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id])

  const handlePick = (opt: ReviewWord) => {
    if (pickedId) return
    if (opt.id === word.id) {
      setPickedId(opt.id)
      setTimeout(onDone, 700)
    } else {
      setWrongId(opt.id)
      onWrong?.(word.id) // ⬅️ 新增
      setTimeout(() => setWrongId(null), 800)
    }
  }

  return (
    <div className="rounded-3xl border-2 border-subtle bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 text-center text-sm text-gray-500">选出下面中文对应的越南语单词</div>
      <div className="mb-8 text-center text-3xl font-bold">{word.trans.join('；')}</div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isCorrect = pickedId === opt.id
          const isWrong = wrongId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt)}
              className={
                'rounded-2xl border-2 px-4 py-4 text-lg transition ' +
                (isCorrect
                  ? 'border-green-400 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : isWrong
                  ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'border-subtle bg-white hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20')
              }
            >
              {opt.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
