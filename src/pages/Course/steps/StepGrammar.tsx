import type { CourseGrammar } from '@/typings/course'

interface Props {
  grammar: CourseGrammar[]
  onNext: () => void
}

export default function StepGrammar({ grammar, onNext }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="mb-2 text-2xl font-bold">语法说明</h2>
      <p className="mb-8 text-sm text-gray-500">从句子中发现规律，马上就能用。</p>

      <div className="space-y-6">
        {grammar.map((g, i) => (
          <div key={i} className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 text-base font-semibold">{g.point}</div>
            <div className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{g.explain}</div>

            {g.examples.length > 0 && (
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <div className="mb-3 text-xs text-gray-400">例句</div>
                <ul className="space-y-3">
                  {g.examples.map((ex, j) => (
                    <li key={j}>
                      <div className="text-base">{ex.vi}</div>
                      <div className="text-sm text-gray-500">{ex.zh}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-8 w-full rounded-2xl bg-indigo-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-indigo-600 active:scale-[0.98]"
      >
        继续
      </button>
    </div>
  )
}
