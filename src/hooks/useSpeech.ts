import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 纯浏览器 TTS 版：
 * - 所有语言都走 speechSynthesis
 * - 具体语言由 option.lang（BCP47，比如 'vi-VN'）决定
 */
export default function useSpeech(text: string, option?: Partial<SpeechSynthesisUtterance>) {
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const optionRef = useRef(option)
  optionRef.current = option

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    utterRef.current = null
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (abort = false) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[useSpeech] speechSynthesis not supported')
        return
      }
      if (!text) return
      if (abort) cancel()

      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }

      const utter = new SpeechSynthesisUtterance(text)
      if (optionRef.current) Object.assign(utter, optionRef.current)

      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = (e) => {
        console.warn('[useSpeech] utter error:', e)
        setSpeaking(false)
      }

      utterRef.current = utter
      window.speechSynthesis.speak(utter)
    },
    [text, cancel],
  )

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { speak, cancel, speaking }
}
