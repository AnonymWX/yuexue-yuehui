import { supabase } from '@/lib/supabase'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'

/** 当前登录用户邮箱；未登录为 null */
export const userAtom = atom<string | null>(null)

/** 当前登录用户 uuid；未登录为 null */
export const userIdAtom = atom<string | null>(null)

/** 登录态是否还在初始化中 */
export const authLoadingAtom = atom<boolean>(true)

export function useAuth() {
  const [user] = useAtom(userAtom)
  const [userId] = useAtom(userIdAtom)
  const loading = useAtomValue(authLoadingAtom)

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { user, userId, loading, login, register, logout }
}

/**
 * 全局初始化：在 Root 组件里调用一次。
 * 读一次当前 session，并订阅 auth 变化，把登录态灌进 atom。
 */
export function useAuthInit() {
  const setUser = useSetAtom(userAtom)
  const setUserId = useSetAtom(userIdAtom)
  const setLoading = useSetAtom(authLoadingAtom)

  useEffect(() => {
    // 首次读取
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user?.email ?? null)
      setUserId(data.session?.user?.id ?? null)
      setLoading(false)
    })

    // 订阅后续变化
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.email ?? null)
      setUserId(session?.user?.id ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [setUser, setUserId, setLoading])
}
