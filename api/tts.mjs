import { EdgeTTS } from 'edge-tts-universal'

const VOICE_MAP = {
  vi: 'vi-VN-HoaiMyNeural',
  en: 'en-US-EmmaMultilingualNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const text = url.searchParams.get('text')?.trim()
    const lang = url.searchParams.get('lang') ?? 'vi'

    if (!text) {
      res.status(400).json({ error: 'Missing text' })
      return
    }
    if (text.length > 500) {
      res.status(400).json({ error: 'Too long' })
      return
    }

    const voice = VOICE_MAP[lang] ?? VOICE_MAP['vi']
    const tts = new EdgeTTS(text, voice)
    const result = await tts.synthesize()
    const buffer = Buffer.from(await result.audio.arrayBuffer())

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
    res.send(buffer)
  } catch (e) {
    console.error('[tts] error:', e)
    res.status(502).json({ error: String(e) })
  }
}
