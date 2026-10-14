import type { Dictionary } from '@/typings'

interface Props {
  open: boolean
  dicts: Dictionary[]
  langLabel: string
  onSelect: (id: string) => void
}

export default function DictPicker({ open, dicts, langLabel, onSelect }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <div className="mb-6">
          <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-gray-100">选择词典</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">请选择一本 {langLabel} 词典开始练习</p>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {dicts.length === 0 && <div className="py-8 text-center text-sm text-gray-400">该语言暂无可用词典</div>}

          {dicts.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{d.name}</div>
                {d.description && <div className="truncate text-xs text-gray-500 dark:text-gray-400">{d.description}</div>}
              </div>
              <span className="ml-3 shrink-0 text-xs text-gray-400">{typeof d.length === 'number' ? `${d.length} 词` : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
