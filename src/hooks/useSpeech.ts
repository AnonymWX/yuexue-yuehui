import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 混合 TTS：
 * - 优先调用服务端 /api/tts（Edge TTS 代理）
 * - 服务端失败时降级到浏览器 speechSynthesis
 */
export default function useSpeech(text: string, option?: Partial<SpeechSynthesisUtterance>) {
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const optionRef = useRef(option)
  const tokenRef = useRef(0)

  optionRef.current = option

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {
        /* ignore */
      }
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const cancel = useCallback(() => {
    tokenRef.current++
    stopCurrent()
    utterRef.current = null
    setSpeaking(false)
  }, [stopCurrent])

  const speakBrowser = useCallback(
    (token: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[useSpeech] speechSynthesis not supported')
        return
      }
      if (tokenRef.current !== token) return

      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }

      const utter = new SpeechSynthesisUtterance(text)
      if (optionRef.current) Object.assign(utter, optionRef.current)

      // 优先选本地语音包
      const lang = optionRef.current?.lang
      if (lang) {
        const voices = window.speechSynthesis.getVoices()
        const localMatch = voices.find((v) => v.lang === lang && v.localService)
        const anyMatch = voices.find((v) => v.lang === lang || v.lang.startsWith(lang.split('-')[0]))
        if (localMatch) utter.voice = localMatch
        else if (anyMatch) utter.voice = anyMatch
      }

      utter.onstart = () => {
        if (tokenRef.current === token) setSpeaking(true)
      }
      utter.onend = () => {
        if (tokenRef.current === token) setSpeaking(false)
      }
      utter.onerror = (e) => {
        console.warn('[useSpeech] utter error:', e)
        if (tokenRef.current === token) setSpeaking(false)
      }

      utterRef.current = utter
      window.speechSynthesis.speak(utter)
    },
    [text],
  )

  const speak = useCallback(
    (abort = false) => {
      if (!text) return
      if (abort) cancel()
      stopCurrent()

      const token = ++tokenRef.current
      const langCode = (optionRef.current?.lang ?? 'vi-VN').split('-')[0]

      // 优先服务端 TTS
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`
      const audio = new Audio(url)
      audioRef.current = audio

      let fellBack = false
      const fallback = () => {
        if (fellBack) return
        fellBack = true
        if (tokenRef.current === token) speakBrowser(token)
      }

      audio.onplay = () => {
        if (tokenRef.current === token) setSpeaking(true)
      }
      audio.onended = () => {
        if (tokenRef.current === token) setSpeaking(false)
      }
      audio.onerror = () => {
        console.warn('[useSpeech] 服务端 TTS 失败，降级到浏览器 TTS')
        fallback()
      }

      audio.play().catch((e) => {
        console.warn('[useSpeech] audio.play 失败', e)
        fallback()
      })
    },
    [text, cancel, stopCurrent, speakBrowser],
  )

  useEffect(() => {
    return () => {
      tokenRef.current++
      if (audioRef.current) {
        try {
          audioRef.current.pause()
        } catch {
          /* ignore */
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  return { speak, cancel, speaking }
}
