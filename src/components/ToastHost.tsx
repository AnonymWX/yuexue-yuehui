// src/components/ToastHost.tsx
import { subscribeToast, type ToastPayload, type ToastKind } from '@/lib/toast'
import { useEffect, useState } from 'react'

const STYLE: Record<ToastKind, string> = {
  success: 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200',
  info: 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  warn: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200',
}

const ICON: Record<ToastKind, string> = {
  success: '✅',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastPayload[]>([])

  useEffect(() => {
    return subscribeToast((t) => {
      setItems((prev) => [...prev, t])
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, t.duration)
    })
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={
            'pointer-events-auto flex items-start gap-2 rounded-2xl border-2 px-4 py-3 text-sm shadow-lg backdrop-blur transition-all ' +
            STYLE[t.kind]
          }
        >
          <span className="shrink-0">{ICON[t.kind]}</span>
          <span className="flex-1 break-words">{t.msg}</span>
          <button
            type="button"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
