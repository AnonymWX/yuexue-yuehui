// src/lib/netError.ts
// 把各种错误归一化成「用户能看懂的文案」+ 节流，避免刷屏
import { toastError, toastWarn } from './toast'

export type ErrorKind = 'offline' | 'auth' | 'server' | 'timeout' | 'unknown'

export interface FriendlyError {
  kind: ErrorKind
  msg: string
}

/** 把任何东西映射成友好错误 */
export function normalizeError(e: unknown): FriendlyError {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { kind: 'offline', msg: '当前网络不可用，请检查网络连接' }
  }

  const anyErr = e as any
  const raw = String(anyErr?.message ?? anyErr ?? '')
  const code = String(anyErr?.code ?? '')
  const status = Number(anyErr?.status ?? 0)

  if (status === 401 || code === 'PGRST301' || /jwt|unauthorized/i.test(raw)) {
    return { kind: 'auth', msg: '登录状态已失效，请重新登录' }
  }
  if (status >= 500) {
    return { kind: 'server', msg: '服务器暂时不可用，请稍后重试' }
  }
  if (/timeout|timed out|ETIMEDOUT/i.test(raw)) {
    return { kind: 'timeout', msg: '请求超时，请稍后重试' }
  }
  if (/Failed to fetch|NetworkError|Network request failed/i.test(raw)) {
    return { kind: 'offline', msg: '网络请求失败，请检查网络' }
  }

  return { kind: 'unknown', msg: raw || '操作失败，请稍后重试' }
}

const lastShown: Partial<Record<ErrorKind, number>> = {}
const THROTTLE_MS = 5000

export function notifyNetError(e: unknown, ctx?: string): void {
  const { kind, msg } = normalizeError(e)

  const now = Date.now()
  if (lastShown[kind] && now - lastShown[kind]! < THROTTLE_MS) {
    console.warn(`[netError:${kind}] ${ctx ?? ''}`, e)
    return
  }
  lastShown[kind] = now

  const text = ctx ? `${ctx}：${msg}` : msg
  if (kind === 'server' || kind === 'unknown') toastError(text)
  else toastWarn(text)

  console.warn(`[netError:${kind}] ${ctx ?? ''}`, e)
}
