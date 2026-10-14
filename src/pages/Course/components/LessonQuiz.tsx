import type { CourseExercise } from '@/typings/course'
import { useState } from 'react'

interface Props {
  exercises: CourseExercise[]
}

export default function LessonQuiz({ exercises }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const setAnswer = (i: number, v: string) => setAnswers((a) => ({ ...a, [i]: v }))

  const isCorrect = (i: number) => {
    const ex = exercises[i]
    const a = (answers[i] ?? '').trim().toLowerCase()
    return a === ex.answer.trim().toLowerCase()
  }

  const score = exercises.filter((_, i) => isCorrect(i)).length

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">⑨ 复习测试</h2>
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-2 font-medium">
              {i + 1}. {ex.question ?? '请输入：'}
            </div>
            {ex.type === 'choose' && ex.options ? (
              <div className="space-y-1">
                {ex.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" name={`q-${i}`} checked={answers[i] === opt} onChange={() => setAnswer(i, opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-800"
                placeholder="在此输入..."
              />
            )}
            {submitted && (
              <div className={`mt-2 text-sm ${isCorrect(i) ? 'text-green-600' : 'text-red-500'}`}>
                {isCorrect(i) ? '✅ 正确' : `❌ 正确答案：${ex.answer}`}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => setSubmitted(true)} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          提交
        </button>
        {submitted && (
          <div className="text-sm">
            得分：{score} / {exercises.length}
          </div>
        )}
      </div>
    </section>
  )
}
