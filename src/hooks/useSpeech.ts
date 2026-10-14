import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 纯浏览器 speechSynthesis，优先选本地语音包
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

      // ★ 关键：优先选 localService: true 的语音
      const lang = optionRef.current?.lang
      if (lang) {
        const voices = window.speechSynthesis.getVoices()
        const langPrefix = lang.split('-')[0]

        // 优先级：本地完全匹配 > 本地前缀匹配 > 在线完全匹配 > 在线前缀匹配
        const localExact = voices.find((v) => v.lang === lang && v.localService)
        const localPrefix = voices.find((v) => v.lang.startsWith(langPrefix) && v.localService)
        const anyExact = voices.find((v) => v.lang === lang)
        const anyPrefix = voices.find((v) => v.lang.startsWith(langPrefix))

        const chosen = localExact ?? localPrefix ?? anyExact ?? anyPrefix
        if (chosen) {
          utter.voice = chosen
          console.log('[useSpeech] 使用语音:', chosen.name, '| local:', chosen.localService)
        }
      }

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
