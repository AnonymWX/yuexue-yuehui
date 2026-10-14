// Vercel Serverless Function —— Edge TTS 代理
// 用法：GET /api/tts?text=xin chào&lang=vi
import { EdgeTTS } from 'edge-tts-universal'

// 语言 → 语音名称映射
const VOICE_MAP: Record<string, string> = {
  vi: 'vi-VN-HoaiMyNeural', // 越南语女声
  en: 'en-US-EmmaMultilingualNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
}

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const text = url.searchParams.get('text')?.trim()
    const lang = url.searchParams.get('lang') ?? 'vi'

    if (!text) {
      res.status(400).json({ error: 'Missing text' })
      return
    }

    if (text.length > 500) {
      res.status(400).json({ error: 'Text too long (max 500 chars)' })
      return
    }

    const voice = VOICE_MAP[lang] ?? VOICE_MAP['vi']
    const tts = new EdgeTTS(text, voice)
    const result = await tts.synthesize()

    // result.audio 是 Blob
    const buffer = Buffer.from(await result.audio.arrayBuffer())

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
    res.send(buffer)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[tts] error:', msg)
    res.status(502).json({ error: `TTS failed: ${msg}` })
  }
}
