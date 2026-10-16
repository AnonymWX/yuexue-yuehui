import { isMobileDevice, speakWithCloudTTS, stopCloudTTS } from '@/lib/cloudTTS'
import { toast } from '@/lib/toast'
import { useCallback, useEffect, useRef, useState } from 'react'

const NOTICE_KEY = 'tts_notice_shown_v1'

const LANG_LABEL: Record<string, string> = {
  vi: '越南语',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  zh: '中文',
  de: '德语',
  id: '印尼语',
}

function noticeMissingVoiceOnce(langPrefix: string) {
  if (typeof window === 'undefined') return
  try {
    const shown = JSON.parse(localStorage.getItem(NOTICE_KEY) ?? '{}')
    if (shown[langPrefix]) return
    shown[langPrefix] = Date.now()
    localStorage.setItem(NOTICE_KEY, JSON.stringify(shown))
  } catch {
    /* ignore */
  }
  const label = LANG_LABEL[langPrefix] ?? langPrefix
  toast(`未检测到${label}语音包，发音可能不准确。可在系统设置里安装${label}语音后重启浏览器。`, 'info')
}

/**
 * 语音 hook：移动端优先用云端 TTS，桌面端用浏览器 speechSynthesis
 */
export default function useSpeech(text: string, option?: Partial<SpeechSynthesisUtterance>) {
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const optionRef = useRef(option)
  optionRef.current = option

  const cancel = useCallback(() => {
    // 停云端
    stopCloudTTS()
    // 停本地
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeaking(false)
      return
    }
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    utterRef.current = null
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (abort = false) => {
      if (!text) return
      if (abort) cancel()

      const langRaw = optionRef.current?.lang ?? 'en-US'
      const langPrefix = langRaw.split('-')[0]

      // ========== 移动端：优先云端 TTS ==========
      if (isMobileDevice()) {
        try {
          await speakWithCloudTTS(text, langPrefix, {
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: (err) => {
              console.warn('[useSpeech] cloud TTS error:', err)
              setSpeaking(false)
            },
          })
          return
        } catch (err) {
          console.warn('[useSpeech] 云端 TTS 失败，降级到浏览器 TTS', err)
          // 继续往下走，用本地 speechSynthesis
        }
      }

      // ========== 桌面端 / 云端失败降级：speechSynthesis ==========
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[useSpeech] speechSynthesis not supported')
        return
      }

      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }

      const utter = new SpeechSynthesisUtterance(text)
      if (optionRef.current) Object.assign(utter, optionRef.current)

      const lang = optionRef.current?.lang
      if (lang) {
        const voices = window.speechSynthesis.getVoices()
        const localExact = voices.find((v) => v.lang === lang && v.localService)
        const localPrefix = voices.find((v) => v.lang.startsWith(langPrefix) && v.localService)
        const anyExact = voices.find((v) => v.lang === lang)
        const anyPrefix = voices.find((v) => v.lang.startsWith(langPrefix))

        const chosen = localExact ?? localPrefix ?? anyExact ?? anyPrefix
        if (chosen) {
          utter.voice = chosen
          console.log('[useSpeech] 使用语音:', chosen.name, '| local:', chosen.localService)
        } else {
          noticeMissingVoiceOnce(langPrefix)
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
      // 卸载时清理
      stopCloudTTS()
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
