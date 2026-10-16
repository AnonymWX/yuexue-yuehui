// src/lib/cloudTTS.ts
// 云端 Edge TTS 客户端（通过 Cloudflare Worker 代理）

// 各语言对应的语音名称
const VOICE_MAP: Record<string, string> = {
  vi: 'vi-VN-HoaiMyNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  en: 'en-US-AvaMultilingualNeural',
}

// ⚠️ 改这两行：
// 把 你的用户名 换成你 Cloudflare Worker 的实际用户名
// 如果你设置了 API_KEY，把它填到 TTS_API_KEY
const TTS_ENDPOINT = 'https://yuexue-tts.anonymwxy.workers.dev/api/tts' // 你的 Cloudflare Worker 地址
const TTS_API_KEY = 'my-tts-key-2026' // 没有设密钥就留空

// 模块级的单例，用于 cancel
let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null

/** 停止当前播放并释放资源 */
export function stopCloudTTS() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
}

/** 判断是否移动端 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

interface CloudTTSOptions {
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: unknown) => void
}

/**
 * 调用云端 TTS 播放语音
 * @param text 要朗读的文本
 * @param lang 语言代码（vi / ja / ko / en）
 */
export async function speakWithCloudTTS(text: string, lang: string, opts: CloudTTSOptions = {}): Promise<void> {
  stopCloudTTS()

  const voice = VOICE_MAP[lang] || VOICE_MAP['en']

  const res = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TTS_API_KEY ? { Authorization: `Bearer ${TTS_API_KEY}` } : {}),
    },
    body: JSON.stringify({ text, voice }),
  })

  if (!res.ok) {
    throw new Error(`Cloud TTS failed: ${res.status}`)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  currentUrl = url

  const audio = new Audio(url)
  currentAudio = audio

  return new Promise<void>((resolve, reject) => {
    audio.onplay = () => opts.onStart?.()
    audio.onended = () => {
      opts.onEnd?.()
      stopCloudTTS()
      resolve()
    }
    audio.onerror = (e) => {
      opts.onError?.(e)
      stopCloudTTS()
      reject(e)
    }
    audio.play().catch((err) => {
      opts.onError?.(err)
      stopCloudTTS()
      reject(err)
    })
  })
}
