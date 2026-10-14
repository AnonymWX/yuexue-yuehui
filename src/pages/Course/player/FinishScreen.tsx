import Header from '@/components/Header'
import type { CourseExercise, CourseGrammar, CourseWord } from '@/typings/course'
import type { Sentence } from '@/typings/sentence'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  courseTitle: string
  onRestart: () => void
  nextCourseUrl?: string | null
  nextCourseTitle?: string
  words?: CourseWord[]
  sentences?: Sentence[]
  grammar?: CourseGrammar[]
  exercises?: CourseExercise[]
}

export default function FinishScreen({
  courseTitle,
  onRestart,
  nextCourseUrl,
  nextCourseTitle,
  words,
  sentences,
  grammar,
  exercises,
}: Props) {
  const [showAnswers, setShowAnswers] = useState(false)

  const hasAnswers =
    (words && words.length > 0) ||
    (sentences && sentences.length > 0) ||
    (grammar && grammar.length > 0) ||
    (exercises && exercises.length > 0)

  return (
    <>
      <Header showNav />
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h1 className="mb-2 text-2xl font-bold">课程完成！</h1>
          <div className="mb-8 text-sm text-gray-500">{courseTitle}</div>

          <div className="mb-8 space-y-2 text-left">
            {['本课目标', '新单词', '重点句子', '句子理解', '语法说明', '听力选择', '听写', '复习测试'].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-green-500">✓</span>
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {nextCourseUrl ? (
              <Link
                to={nextCourseUrl}
                className="block w-full rounded-2xl bg-indigo-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-indigo-600"
              >
                开始下一课{nextCourseTitle ? `：${nextCourseTitle}` : ''}
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-4 text-sm text-gray-400 dark:border-gray-700">
                下一课即将上线
              </div>
            )}

            <button
              type="button"
              onClick={onRestart}
              className="w-full rounded-2xl border border-gray-200 px-6 py-4 text-base font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              再复习一次
            </button>

            {hasAnswers && (
              <button
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
                className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-4 text-base font-medium text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
              >
                {showAnswers ? '收起答案' : '查看本课答案'}
              </button>
            )}
          </div>
        </div>

        {showAnswers && hasAnswers && (
          <div className="mt-10 space-y-5 text-left">
            {words && words.length > 0 && (
              <AnswerSection title="② 新单词">
                <ul className="space-y-2">
                  {words.map((w) => (
                    <li key={w.id} className="text-sm">
                      <span className="font-medium">{w.name}</span>
                      <span className="text-gray-500"> — {w.trans.join('；')}</span>
                    </li>
                  ))}
                </ul>
              </AnswerSection>
            )}

            {sentences && sentences.length > 0 && (
              <AnswerSection title="③ 重点句子（同 ④ 句子理解 / ⑥ 听力 / ⑦ 听写）">
                <ul className="space-y-2">
                  {sentences.map((s) => (
                    <li key={s.id} className="text-sm">
                      <div className="font-medium">{s.text}</div>
                      <div className="text-gray-500">{s.translation}</div>
                    </li>
                  ))}
                </ul>
              </AnswerSection>
            )}

            {grammar && grammar.length > 0 && (
              <AnswerSection title="⑤ 语法说明">
                <div className="space-y-4">
                  {grammar.map((g, i) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium">{g.point}</div>
                      <div className="mt-1 text-gray-500">{g.explain}</div>
                      {g.examples.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4 text-gray-600 dark:text-gray-400">
                          {g.examples.map((ex, j) => (
                            <li key={j}>
                              <div className="font-medium">{ex.vi}</div>
                              <div className="text-gray-500">{ex.zh}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </AnswerSection>
            )}

            {exercises && exercises.length > 0 && (
              <AnswerSection title="⑧ 复习测试">
                <ol className="space-y-3">
                  {exercises.map((ex, i) => (
                    <li key={i} className="text-sm">
                      <div className="font-medium">
                        {i + 1}. {ex.question ?? '请输入：'}
                      </div>
                      <div className="mt-1 text-green-600">答案：{ex.answer}</div>
                    </li>
                  ))}
                </ol>
              </AnswerSection>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function AnswerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</div>
      {children}
    </div>
  )
}
