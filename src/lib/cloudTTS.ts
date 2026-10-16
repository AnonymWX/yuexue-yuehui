// src/lib/cloudTTS.ts
// 云端 Edge TTS 客户端（Cloudflare Worker 代理）
// 优化：内存缓存 + Cache API 持久化 + 请求去重 + 预加载队列

const VOICE_MAP: Record<string, string> = {
  vi: 'vi-VN-HoaiMyNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  en: 'en-US-AvaMultilingualNeural',
}

const TTS_ENDPOINT = 'https://yuexue-tts.anonymwxy.workers.dev/api/tts'
const TTS_API_KEY = 'my-tts-key-2026'

/* ==================== 缓存配置 ==================== */

const CACHE_NAME = 'cloud-tts-v1'
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 天
const MEMORY_MAX = 100 // 内存缓存最多 100 条
const PREFETCH_CONCURRENCY = 3 // 预加载最多 3 个并发

// 一级缓存：内存 Map（会话内 0 延迟）
const memoryCache = new Map<string, string>()

// 请求去重：同一个 key 的请求合并为一个
const inflight = new Map<string, Promise<string>>()

/* ==================== 工具函数 ==================== */

function makeKey(lang: string, text: string) {
  return `${lang}::${text}`
}

function makeCacheUrl(k: string) {
  // 用虚拟 URL 作为 Cache API 的 key
  return `https://cloud-tts.internal/${encodeURIComponent(k)}`
}

function memGet(k: string): string | undefined {
  return memoryCache.get(k)
}

function memSet(k: string, url: string) {
  if (memoryCache.size >= MEMORY_MAX) {
    const oldest = memoryCache.keys().next().value
    if (oldest) {
      const u = memoryCache.get(oldest)
      if (u) URL.revokeObjectURL(u)
      memoryCache.delete(oldest)
    }
  }
  memoryCache.set(k, url)
}

/* ==================== Cache API 持久化 ==================== */

async function persistentGet(k: string): Promise<string | null> {
  if (typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(CACHE_NAME)
    const res = await cache.match(makeCacheUrl(k))
    if (!res) return null

    // 过期检查
    const cachedAt = Number(res.headers.get('X-Cached-At') || '0')
    if (cachedAt && Date.now() - cachedAt > CACHE_MAX_AGE_MS) {
      cache.delete(makeCacheUrl(k)).catch(() => {})
      return null
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    memSet(k, url)
    return url
  } catch {
    return null
  }
}

async function persistentPut(k: string, blob: Blob): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      makeCacheUrl(k),
      new Response(blob, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Cached-At': Date.now().toString(),
        },
      }),
    )
  } catch {
    // 存储满或隐私模式，静默忽略
  }
}

/* ==================== 核心：请求 + 去重 ==================== */

async function fetchAudio(k: string, text: string, lang: string): Promise<string> {
  // 请求去重：已有进行中的请求，直接复用
  const existing = inflight.get(k)
  if (existing) return existing

  const voice = VOICE_MAP[lang] || VOICE_MAP['en']

  const promise = (async (): Promise<string> => {
    try {
      const res = await fetch(TTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TTS_API_KEY ? { Authorization: `Bearer ${TTS_API_KEY}` } : {}),
        },
        body: JSON.stringify({ text, voice }),
      })

      if (!res.ok) throw new Error(`Cloud TTS failed: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      // 同时写入内存缓存和持久化缓存
      memSet(k, url)
      persistentPut(k, blob).catch(() => {})

      return url
    } finally {
      inflight.delete(k)
    }
  })()

  inflight.set(k, promise)
  return promise
}

/* ==================== 播放状态 ==================== */

let currentAudio: HTMLAudioElement | null = null

export function stopCloudTTS() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {
      /* ignore */
    }
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.onplay = null
    currentAudio = null
  }
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/* ==================== 对外 API ==================== */

interface CloudTTSOptions {
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: unknown) => void
}

export async function speakWithCloudTTS(text: string, lang: string, opts: CloudTTSOptions = {}): Promise<void> {
  stopCloudTTS()
  if (!text) return

  const k = makeKey(lang, text)

  // 1. 内存缓存命中
  let url = memGet(k)

  // 2. 持久化缓存命中
  if (!url) {
    url = (await persistentGet(k)) ?? undefined
  }

  // 3. 都没有 → 请求云端
  if (!url) {
    url = await fetchAudio(k, text, lang)
  }

  // 4. 播放
  const audio = new Audio(url)
  currentAudio = audio

  return new Promise<void>((resolve, reject) => {
    audio.onplay = () => opts.onStart?.()
    audio.onended = () => {
      opts.onEnd?.()
      if (currentAudio === audio) currentAudio = null
      resolve()
    }
    audio.onerror = (e) => {
      opts.onError?.(e)
      if (currentAudio === audio) currentAudio = null
      reject(e)
    }
    audio.play().catch((err) => {
      opts.onError?.(err)
      if (currentAudio === audio) currentAudio = null
      reject(err)
    })
  })
}

/* ==================== 预加载队列 ==================== */

const prefetchQueue: Array<() => Promise<void>> = []
let prefetchActive = 0

function processPrefetchQueue() {
  while (prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue.length > 0) {
    const task = prefetchQueue.shift()!
    prefetchActive++
    task().finally(() => {
      prefetchActive--
      processPrefetchQueue()
    })
  }
}

/**
 * 预加载：把文本对应的音频提前放进缓存
 * 并发受限，多次调用会自动排队
 */
export function prefetchCloudTTS(text: string, lang: string): void {
  if (!text) return
  const k = makeKey(lang, text)

  // 已在内存或进行中，跳过
  if (memGet(k) || inflight.has(k)) return

  prefetchQueue.push(async () => {
    // 再次检查持久化缓存
    const cached = await persistentGet(k)
    if (cached) return
    try {
      await fetchAudio(k, text, lang)
    } catch {
      /* 预加载失败静默忽略 */
    }
  })

  processPrefetchQueue()
}

/** 批量预加载 */
export function prefetchCloudTTSBatch(items: Array<{ text: string; lang: string }>): void {
  for (const it of items) prefetchCloudTTS(it.text, it.lang)
}

/* ==================== 缓存管理 ==================== */

/** 清空所有缓存（内存 + 持久化） */
export async function clearCloudTTSCache(): Promise<void> {
  memoryCache.forEach((url) => {
    URL.revokeObjectURL(url)
  })
  memoryCache.clear()

  if (typeof caches !== 'undefined') {
    try {
      await caches.delete(CACHE_NAME)
    } catch {
      /* ignore */
    }
  }
}

/** 清理过期缓存（建议应用启动时调用一次） */
export async function cleanExpiredCache(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const cache = await caches.open(CACHE_NAME)
    const reqs = await cache.keys()
    const now = Date.now()
    for (const req of reqs) {
      const res = await cache.match(req)
      if (!res) continue
      const cachedAt = Number(res.headers.get('X-Cached-At') || '0')
      if (cachedAt && now - cachedAt > CACHE_MAX_AGE_MS) {
        await cache.delete(req)
      }
    }
  } catch {
    /* ignore */
  }
}

/** 缓存统计（调试用） */
export async function getCacheStats(): Promise<{ memory: number; persistent: number }> {
  let persistent = 0
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME)
      const reqs = await cache.keys()
      persistent = reqs.length
    } catch {
      /* ignore */
    }
  }
  return { memory: memoryCache.size, persistent }
}
