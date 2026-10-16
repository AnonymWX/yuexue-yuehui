// src/pages/Course/steps/LangFillInput.tsx
// 通用状态机输入组件：越南语 Telex / 日语 Romaji / 韩语 2-beolsik
import { createBeolsikEngine } from '@/engines/beolsik/state-machine'
import { createRomajiEngine } from '@/engines/romaji/state-machine'
import { createTelexEngine } from '@/engines/telex'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'

interface Engine {
  feed(key: string): { status: 'ok' | 'reject'; display: string }
  readonly display: string
}

function createEngine(lang: string, target: string): Engine {
  if (lang === 'ja') return createRomajiEngine()
  if (lang === 'ko') return createBeolsikEngine()
  return createTelexEngine(target) as unknown as Engine
}

/* ==================== 对外工具 ==================== */

export function renderLangInput(lang: string, target: string, raw: string): string {
  if (raw.length === 0) return ''
  if (/[^\x00-\x7F]/.test(raw)) return raw

  const engine = createEngine(lang, target)
  let display = ''
  for (let i = 0; i < raw.length; i++) {
    const r = engine.feed(raw[i])
    if (r.status === 'reject') return display
    display = r.display
  }
  return display || raw
}

function stripPunct(s: string): string {
  return s
    .replace(/[.,!?;:。！？；：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isLangMatch(lang: string, target: string, raw: string): boolean {
  if (!raw.trim()) return false
  const rawStripped = stripPunct(raw)
  const targetStripped = stripPunct(target)
  if (!rawStripped) return false
  const display = renderLangInput(lang, targetStripped, rawStripped).trim()
  return display.toLowerCase().normalize('NFC') === targetStripped.toLowerCase().normalize('NFC')
}

/* ==================== 组件 ==================== */

interface Props {
  target: string
  value: string
  onChange: (raw: string) => void
  onEnter?: () => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

interface KeyInfo {
  key: string
  status: 'ok' | 'reject'
  displayAfter: string
}

function analyzeKeys(lang: string, target: string, raw: string): KeyInfo[] {
  if (!raw) return []
  if (/[^\x00-\x7F]/.test(raw)) {
    return raw.split('').map((k) => ({ key: k, status: 'ok' as const, displayAfter: '' }))
  }

  const engine = createEngine(lang, target)
  const result: KeyInfo[] = []
  let rejected = false
  let display = ''

  for (let i = 0; i < raw.length; i++) {
    const k = raw[i]
    if (rejected) {
      result.push({ key: k, status: 'reject', displayAfter: display })
      continue
    }
    const r = engine.feed(k)
    if (r.status === 'reject') {
      rejected = true
      result.push({ key: k, status: 'reject', displayAfter: display })
    } else {
      display = r.display
      result.push({ key: k, status: 'ok', displayAfter: display })
    }
  }
  return result
}

export default function LangFillInput({ target, value, onChange, onEnter, disabled, placeholder, autoFocus }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef(value)

  const onChangeRef = useRef(onChange)
  const onEnterRef = useRef(onEnter)
  const disabledRef = useRef(disabled)
  const targetRef = useRef(target)
  const langRef = useRef(lang)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    onEnterRef.current = onEnter
  }, [onEnter])
  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])
  useEffect(() => {
    targetRef.current = target
  }, [target])
  useEffect(() => {
    langRef.current = lang
  }, [lang])

  const display = renderLangInput(lang, target, value)
  const analyzed = useMemo(() => analyzeKeys(lang, target, value), [lang, target, value])

  const isFullyMatched = useMemo(() => {
    if (!value.trim()) return false
    const sv = stripPunct(value)
    const st = stripPunct(target)
    if (!sv) return false
    const d = renderLangInput(lang, st, sv).trim()
    return d.toLowerCase().normalize('NFC') === st.toLowerCase().normalize('NFC')
  }, [lang, value, target])

  const hasReject = !isFullyMatched && analyzed.some((a) => a.status === 'reject')

  const lastOkDisplay = useMemo(() => {
    for (let i = analyzed.length - 1; i >= 0; i--) {
      if (analyzed[i].status === 'ok') return analyzed[i].displayAfter
    }
    return ''
  }, [analyzed])

  const applyDisplay = (raw: string) => {
    const el = inputRef.current
    if (!el) return
    const d = renderLangInput(langRef.current, targetRef.current, raw)
    if (el.value !== d) {
      el.value = d
    }
    const len = d.length
    try {
      el.setSelectionRange(len, len)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    applyDisplay(bufferRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (bufferRef.current !== value) {
      bufferRef.current = value
      applyDisplay(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const el = inputRef.current
    if (el && autoFocus && !disabled) {
      el.focus()
      applyDisplay(bufferRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const handler = (e: KeyboardEvent) => {
      if (disabledRef.current) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.isComposing || e.keyCode === 229) return
      if (document.activeElement !== el) return

      if (e.key === 'Enter') {
        e.preventDefault()
        onEnterRef.current?.()
        return
      }

      let next: string | null = null
      if (e.key === 'Backspace') {
        e.preventDefault()
        next = bufferRef.current.slice(0, -1)
      } else if (e.key.length === 1 && /^[\x20-\x7E]$/.test(e.key)) {
        e.preventDefault()
        next = bufferRef.current + e.key
      }

      if (next !== null) {
        bufferRef.current = next
        applyDisplay(next)
        onChangeRef.current(next)
      }
    }

    el.addEventListener('keydown', handler, true)
    const inputHandler = () => applyDisplay(bufferRef.current)
    el.addEventListener('input', inputHandler)

    return () => {
      el.removeEventListener('keydown', handler, true)
      el.removeEventListener('input', inputHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={
          'w-full rounded-2xl border bg-white px-4 py-3 text-lg outline-none transition disabled:opacity-60 dark:bg-gray-800 ' +
          (hasReject
            ? 'border-red-400 focus:border-red-500 dark:border-red-800'
            : isFullyMatched
            ? 'border-green-400 focus:border-green-500 dark:border-green-800'
            : 'border-gray-200 focus:border-indigo-500 dark:border-gray-700')
        }
      />

      {value.length > 0 && (
        <div className="mt-2 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs text-gray-400">按键</span>
            <div className="flex flex-wrap items-center gap-1">
              {analyzed.map((item, i) => {
                const effectiveStatus = isFullyMatched ? 'ok' : item.status
                return (
                  <span
                    key={i}
                    title={effectiveStatus === 'ok' ? `→ ${item.displayAfter || '·'}` : '按键无法匹配'}
                    className={
                      'min-w-6 flex h-6 items-center justify-center rounded px-1.5 font-mono text-xs font-semibold transition ' +
                      (effectiveStatus === 'ok'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800')
                    }
                  >
                    {item.key === ' ' ? '␣' : item.key}
                  </span>
                )
              })}
            </div>
          </div>

          {isFullyMatched ? (
            <div className="mt-1.5 text-xs text-green-600">
              ✅ 已完成 <span className="font-mono font-semibold">{display}</span>
            </div>
          ) : hasReject ? (
            <div className="mt-1.5 text-xs text-red-500">
              ❌ 从红色按键开始不匹配，已正确输入到 <span className="font-mono font-semibold">{lastOkDisplay || '（开头）'}</span>， 按
              Backspace 逐个删除
            </div>
          ) : (
            <div className="mt-1.5 text-xs text-gray-400">
              已输入 <span className="font-mono">{display || '·'}</span>
              <span className="ml-2 text-gray-300 dark:text-gray-600">Backspace 删一个键</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
