import ProgressDots from './ProgressDots'

interface Props {
  total: number
  current: number
  onExit: () => void
}

export default function PlayerTopBar({ total, current, onExit }: Props) {
  return (
    <div className="bg-white/85 dark:bg-gray-900/85 sticky top-0 z-10 flex items-center gap-4 border-b border-gray-100 px-6 py-4 backdrop-blur dark:border-gray-800">
      <button
        type="button"
        onClick={onExit}
        aria-label="退出"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
      >
        ✕
      </button>
      <div className="flex-1">
        <ProgressDots total={total} current={current} />
      </div>
    </div>
  )
}
