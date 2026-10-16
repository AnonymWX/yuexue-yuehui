// src/lib/ttsLang.ts
// 语言代码 → BCP47 TTS 语言标签
export const TTS_LANG: Record<string, string> = {
  vi: 'vi-VN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  en: 'en-US',
}

export function ttsLangOf(lang: string): string {
  return TTS_LANG[lang] ?? 'en-US'
}
