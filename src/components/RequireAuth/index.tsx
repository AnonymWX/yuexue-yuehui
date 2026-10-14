import { isUnlockedForLang } from '@/pages/Drill/useDrillProgress'
import { useAuth } from '@/pages/Login/useAuth'
import { currentLanguageAtom } from '@/store/language'
import { practiceProgressLoadedAtom } from '@/store/practiceProgress'
import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface Props {
  children: ReactNode
  /** 未解锁时也允许访问（用于练习相关页面） */
  allowLocked?: boolean
}

export default function RequireAuth({ children, allowLocked = false }: Props) {
  const { user, loading } = useAuth()
  const practiceLoaded = useAtomValue(practiceProgressLoadedAtom)
  const lang = useAtomValue(currentLanguageAtom)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!practiceLoaded) return null
  // 当前语言的练习未过 → 强制去 /practice（英语等无练习语言由 isUnlockedForLang 恒返回 true）
  if (!allowLocked && !isUnlockedForLang(lang)) return <Navigate to="/practice" replace />

  return <>{children}</>
}
