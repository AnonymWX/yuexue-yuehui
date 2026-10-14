interface Props {
  canContinue: boolean
  onContinue: () => void
  label?: string
}

export default function PlayerBottomBar({ canContinue, onContinue, label }: Props) {
  return (
    <div className="sticky bottom-0 border-t border-gray-100 bg-white/90 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={
          'w-full rounded-2xl px-6 py-4 text-base font-semibold transition ' +
          (canContinue
            ? 'bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 active:scale-[0.98]'
            : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600')
        }
      >
        {label ?? '继续'}
      </button>
    </div>
  )
}
