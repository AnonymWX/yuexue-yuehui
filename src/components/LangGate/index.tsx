import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface Props {
  /** 只在这些语言下渲染子元素 */
  langs: string[]
  children: ReactNode
}

/** 语言守卫：当前语言不在 langs 里就重定向首页 */
export default function LangGate({ langs, children }: Props) {
  const current = useAtomValue(currentLanguageAtom)
  if (!langs.includes(current)) return <Navigate to="/" replace />
  return <>{children}</>
}
