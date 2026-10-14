import { SoundIcon } from './SoundIcon'
import useSpeech from '@/hooks/useSpeech'
import type { Word } from '@/typings'
import { useCallback, useEffect, useImperativeHandle, useMemo } from 'react'
import React from 'react'

/** 词典语言代码 → BCP47 */
const LANG_TO_BCP47: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  us: 'en-US',
  uk: 'en-GB',
  ja: 'ja-JP',
  romaji: 'ja-JP',
  zh: 'zh-CN',
  de: 'de-DE',
  id: 'id-ID',
  hapin: 'kk-KZ',
  kk: 'kk-KZ',
}

function toBCP47(lang: string | undefined): string {
  if (!lang) return 'en-US'
  return LANG_TO_BCP47[lang] ?? 'en-US'
}

export type WordPronunciationIconRef = {
  play: () => void
}

export const WordPronunciationIcon = React.forwardRef<
  WordPronunciationIconRef,
  { word: Word; lang: string; className?: string; iconClassName?: string }
>(({ word, lang, className, iconClassName }, ref) => {
  // 要朗读的文本（哈萨克语保留原逻辑）
  const text = useMemo(() => {
    if (lang === 'hapin') {
      if (/[\u0400-\u04FF]/.test(word.notation || '')) return word.notation || ''
      return word.trans[2] ?? word.name
    }
    return word.name
  }, [lang, word])

  const option = useMemo(() => ({ lang: toBCP47(lang) }), [lang])
  const { speak, cancel, speaking } = useSpeech(text, option)

  const playSound = useCallback(() => {
    speak(true)
  }, [speak])

  useEffect(() => {
    return () => cancel()
  }, [cancel])

  useImperativeHandle(ref, () => ({ play: playSound }), [playSound])

  return (
    <SoundIcon
      animated={speaking}
      onClick={playSound}
      className={`cursor-pointer text-gray-600 ${className}`}
      iconClassName={iconClassName}
    />
  )
})

WordPronunciationIcon.displayName = 'WordPronunciationIcon'
