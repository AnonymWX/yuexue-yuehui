interface Props {
  /** 1-based，用户看到的"第几步"（1~total） */
  currentStep: number
  total: number
  onContinue: () => void
  onRestart: () => void
}

export default function ResumeDialog({ currentStep, total, onContinue, onRestart }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-2 text-xl font-bold">继续上次学习？</div>
        <div className="mb-6 text-sm text-gray-500">
          你上次学到第 {currentStep} 步 / 共 {total} 步
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-600"
          >
            继续学习
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-2xl border border-gray-200 px-6 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  )
}
