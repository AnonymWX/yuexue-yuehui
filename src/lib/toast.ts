export type ToastKind = 'success' | 'info' | 'warn' | 'error'
export type ToastPayload = { id: number; kind: ToastKind; msg: string; duration: number }

type Listener = (t: ToastPayload) => void

const listeners = new Set<Listener>()
let seq = 0

export function subscribeToast(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function toast(msg: string, kind: ToastKind = 'info', duration = 3000): void {
  const payload: ToastPayload = { id: ++seq, kind, msg, duration }
  listeners.forEach((fn) => fn(payload))
}

export const toastSuccess = (msg: string) => toast(msg, 'success')
export const toastError = (msg: string) => toast(msg, 'error', 4500)
export const toastWarn = (msg: string) => toast(msg, 'warn', 4000)
