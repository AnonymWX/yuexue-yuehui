import { pronunciationConfigAtom } from '@/store'
import type { PronunciationType } from '@/typings'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useRef, useState } from 'react'

/** PronunciationType → BCP47 语言代码 */
const LANG_MAP: Record<string, string> = {
  us: 'en-US',
  uk: 'en-GB',
  romaji: 'ja-JP',
  ja: 'ja-JP',
  zh: 'zh-CN',
  de: 'de-DE',
  vi: 'vi-VN',
  id: 'id-ID',
  hapin: 'kk-KZ',
  kk: 'kk-KZ',
}

/** 该 pronunciation 类型对应的语言代码 */
export function generateWordSoundLang(pronunciation: PronunciationType): string {
  if (!pronunciation) return 'en-US'
  return LANG_MAP[pronunciation] ?? 'en-US'
}

/**
 * 用浏览器 speechSynthesis 播放单词
 * 兼容原 usePronunciationSound 接口：返回 { play, stop, isPlaying }
 */
export default function usePronunciationSound(word: string, isLoop?: boolean, overrideType?: PronunciationType) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const loop = useMemo(() => (typeof isLoop === 'boolean' ? isLoop : pronunciationConfig.isLoop), [isLoop, pronunciationConfig.isLoop])
  const [isPlaying, setIsPlaying] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  // 卸载时停止
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

  const stop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    setIsPlaying(false)
  }

  const play = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[usePronunciation] speechSynthesis not supported')
      return
    }
    if (!word) return

    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }

    const effectiveType = overrideType ?? pronunciationConfig.type
    const lang = generateWordSoundLang(effectiveType)

    const utter = new SpeechSynthesisUtterance(word)
    utter.lang = lang
    utter.volume = pronunciationConfig.volume ?? 1
    utter.rate = pronunciationConfig.rate ?? 1

    // 优先选本地语音包
    const voices = window.speechSynthesis.getVoices()
    const langPrefix = lang.split('-')[0]
    const localExact = voices.find((v) => v.lang === lang && v.localService)
    const anyExact = voices.find((v) => v.lang === lang)
    const localPrefix = voices.find((v) => v.lang.startsWith(langPrefix) && v.localService)
    const anyPrefix = voices.find((v) => v.lang.startsWith(langPrefix))
    const chosen = localExact ?? anyExact ?? localPrefix ?? anyPrefix
    if (chosen) {
      utter.voice = chosen
      console.log(`[usePronunciation] "${word}" → ${chosen.name} (${chosen.lang}) | local: ${chosen.localService}`)
    } else {
      console.warn(`[usePronunciation] 找不到 ${lang} 的语音，使用系统默认`)
    }

    utter.onstart = () => setIsPlaying(true)
    utter.onend = () => {
      setIsPlaying(false)
      if (loop) {
        // 循环：重新播一次
        setTimeout(() => play(), 300)
      }
    }
    utter.onerror = (e) => {
      console.warn('[usePronunciation] utter error:', e)
      setIsPlaying(false)
    }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }

  return { play, stop, isPlaying }
}

/** 预加载：speechSynthesis 无需预加载，保留空函数保证接口兼容 */
export function usePrefetchPronunciationSound(_word: string | undefined) {
  // speechSynthesis 不需要预加载
  return
}
