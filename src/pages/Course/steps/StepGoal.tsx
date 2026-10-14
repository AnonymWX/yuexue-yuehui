interface Props {
  goals: string[]
  onNext: () => void
  courseLabel?: string | null
}

export default function StepGoal({ goals, onNext, courseLabel }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {courseLabel && <div className="mb-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">{courseLabel}</div>}
      <h2 className="mb-2 text-2xl font-bold">本课目标</h2>
      <p className="mb-8 text-sm text-gray-500">完成本课后，你将学会：</p>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <ul className="space-y-4">
          {goals.map((g, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
                ✓
              </span>
              <span className="text-base leading-relaxed">{g}</span>
            </li>
          ))}
        </ul>
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
