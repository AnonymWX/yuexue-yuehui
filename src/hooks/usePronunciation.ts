import { speakWithCloudTTS, stopCloudTTS } from '@/lib/cloudTTS'
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
  ko: 'ko-KR',
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
 * 播放单词发音：
 * 1. 优先走云端 TTS（所有端统一）
 * 2. 云端失败自动降级到浏览器 speechSynthesis
 */
export default function usePronunciationSound(word: string, isLoop?: boolean, overrideType?: PronunciationType) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const loop = useMemo(() => (typeof isLoop === 'boolean' ? isLoop : pronunciationConfig.isLoop), [isLoop, pronunciationConfig.isLoop])
  const [isPlaying, setIsPlaying] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const loopTimerRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  // 用来防止上一轮的异步返回后误操作新一轮播放
  const playSessionRef = useRef(0)

  // 同步 isPlaying 到 ref，便于循环时判断
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // 卸载时停止一切
  useEffect(() => {
    return () => {
      if (loopTimerRef.current) {
        window.clearTimeout(loopTimerRef.current)
        loopTimerRef.current = null
      }
      stopCloudTTS()
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const stop = () => {
    playSessionRef.current++ // 让正在进行的播放失效
    if (loopTimerRef.current) {
      window.clearTimeout(loopTimerRef.current)
      loopTimerRef.current = null
    }
    stopCloudTTS()
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false)
      return
    }
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    setIsPlaying(false)
  }

  // 内部函数：降级到 speechSynthesis
  const fallbackSpeak = (lang: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[usePronunciation] speechSynthesis not supported')
      setIsPlaying(false)
      return
    }

    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }

    const utter = new SpeechSynthesisUtterance(word)
    utter.lang = lang
    utter.volume = pronunciationConfig.volume ?? 1
    utter.rate = pronunciationConfig.rate ?? 1

    const voices = window.speechSynthesis.getVoices()
    const langPrefix = lang.split('-')[0]
    const localExact = voices.find((v) => v.lang === lang && v.localService)
    const anyExact = voices.find((v) => v.lang === lang)
    const localPrefix = voices.find((v) => v.lang.startsWith(langPrefix) && v.localService)
    const anyPrefix = voices.find((v) => v.lang.startsWith(langPrefix))
    const chosen = localExact ?? anyExact ?? localPrefix ?? anyPrefix
    if (chosen) {
      utter.voice = chosen
    }

    utter.onstart = () => setIsPlaying(true)
    utter.onend = () => {
      setIsPlaying(false)
      if (loop && isPlayingRef.current) {
        loopTimerRef.current = window.setTimeout(() => play(), 300)
      }
    }
    utter.onerror = (e) => {
      console.warn('[usePronunciation] utter error:', e)
      setIsPlaying(false)
    }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }

  const play = async () => {
    if (!word) return
    const session = ++playSessionRef.current // 记录本次播放的 session id

    const effectiveType = overrideType ?? pronunciationConfig.type
    const lang = generateWordSoundLang(effectiveType)
    const langPrefix = lang.split('-')[0]

    // ========== 优先云端 TTS ==========
    try {
      setIsPlaying(true)
      await speakWithCloudTTS(word, langPrefix, {
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          // 如果期间用户切换了或者停止了，不再循环
          if (session !== playSessionRef.current) return
          setIsPlaying(false)
          if (loop && isPlayingRef.current) {
            loopTimerRef.current = window.setTimeout(() => play(), 300)
          }
        },
        onError: (err) => {
          console.warn('[usePronunciation] cloud TTS error:', err)
          if (session !== playSessionRef.current) return
          setIsPlaying(false)
        },
      })
      return
    } catch (err) {
      console.warn('[usePronunciation] 云端 TTS 失败，降级到浏览器 TTS', err)
      if (session !== playSessionRef.current) return
    }

    // ========== 降级：speechSynthesis ==========
    fallbackSpeak(lang)
  }

  return { play, stop, isPlaying }
}

/** 预加载：云端 TTS 可扩展为预热连接，目前保留空函数 */
export function usePrefetchPronunciationSound(_word: string | undefined) {
  return
}
