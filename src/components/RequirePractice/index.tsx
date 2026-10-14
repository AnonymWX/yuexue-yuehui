import { hasPracticeForLang } from '@/pages/Drill/useDrillProgress'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface Props {
  children: ReactNode
}

/** 练习页守卫：当前语言无练习（如英语）→ 重定向首页 */
export default function RequirePractice({ children }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  if (!hasPracticeForLang(lang)) return <Navigate to="/" replace />
  return <>{children}</>
}
