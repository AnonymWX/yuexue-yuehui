import { THEME_REGISTRY, getThemeMeta, themeAtom, setThemeAtom, type ThemeCode } from '@/store/theme'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export default function ThemeSwitcher() {
  const current = useAtomValue(themeAtom)
  const setTheme = useSetAtom(setThemeAtom)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const meta = getThemeMeta(current)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleSelect = (code: ThemeCode) => {
    setOpen(false)
    if (code === current) return
    setTheme(code)
  }

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-2xl border-2 border-[#E8E2D4] bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {THEME_REGISTRY.map((t) => {
            const active = t.code === current
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => handleSelect(t.code)}
                className={
                  'flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition ' +
                  (active
                    ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700')
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">{t.icon}</span>
                <span className="flex-1 whitespace-nowrap">
                  <span className="font-bold">{t.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{t.desc}</span>
                </span>
                {active && <span className="text-xs">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-600 transition hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30"
        title={`当前主题：${meta.name}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">{meta.icon}</span>
        <span className="max-w-0 flex-1 overflow-hidden whitespace-nowrap text-left opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100">
          {meta.name}
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs text-gray-400 opacity-0 transition-all duration-200 group-hover:max-w-xs group-hover:opacity-100">
          {open ? '▲' : '▼'}
        </span>
      </button>
    </div>
  )
}
