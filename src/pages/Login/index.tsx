import { useAuth } from './useAuth'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimEmail = email.trim()
    if (!trimEmail) {
      setError('请输入邮箱')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setError('邮箱格式不正确')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(trimEmail, password)
      } else {
        await register(trimEmail, password)
        setRegisterSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="w-full max-w-md">
        {/* Logo + 标题 */}
        <div className="mb-10 flex flex-col items-center">
          <div className="shadow-primary-lg mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500 text-3xl font-bold text-white">
            越
          </div>
          <h1 className="mb-1 text-2xl font-bold text-gray-800 dark:text-gray-100">越学越会</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? '登录账号，继续你的学习进度' : '注册新账号，云端同步学习进度'}
          </p>
        </div>

        {/* 登录 / 注册 切换 */}
        <div className="mb-6 flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
              setRegisterSuccess(false)
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow dark:bg-gray-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
              setRegisterSuccess(false)
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow dark:bg-gray-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            注册
          </button>
        </div>

        {registerSuccess ? (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
              <div className="mb-2 font-bold">注册成功 ✅</div>
              <div>请前往邮箱查收验证邮件，点开邮件里的链接完成验证后再回来登录。</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRegisterSuccess(false)
                setMode('login')
                setPassword('')
              }}
              className="shadow-primary-lg w-full rounded-2xl bg-indigo-500 px-6 py-4 text-lg font-bold text-white transition hover:brightness-95 active:translate-y-[3px]"
            >
              去登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              autoComplete="email"
              autoFocus
              className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-lg outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少 6 位）"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-lg outline-none transition focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-500"
            />

            {error && (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="shadow-primary-lg w-full rounded-2xl bg-indigo-500 px-6 py-4 text-lg font-bold text-white transition hover:brightness-95 active:translate-y-[3px] active:shadow-[0_1px_0_0_rgb(var(--primary-600))] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-[0_4px_0_0_#d1d5db] dark:disabled:bg-gray-700"
            >
              {submitting ? '处理中...' : mode === 'login' ? '登录 →' : '注册 →'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">数据云端同步，换设备登录也能保留进度</p>
      </div>
    </div>
  )
}
