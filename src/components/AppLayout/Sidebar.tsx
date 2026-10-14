import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { hasPracticeForLang } from '@/pages/Drill/useDrillProgress'
import { useAuth } from '@/pages/Login/useAuth'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { NavLink, useNavigate } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  requiresPractice?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/practice', label: '练习', icon: '🎓', requiresPractice: true },
  { to: '/course', label: '课程', icon: '📚' },
  { to: '/review', label: '复习', icon: '🎯' },
  { to: '/typing', label: '单词', icon: '⌨️' },
]

const activeClass = 'bg-indigo-500 text-white shadow-primary'
const normalClass = 'text-gray-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const currentLang = useAtomValue(currentLanguageAtom)

  const baseClass = 'flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-bold transition'

  return (
    <aside className="group fixed left-0 top-0 z-30 flex h-screen w-20 shrink-0 flex-col border-r-2 border-subtle bg-white transition-[width] duration-200 ease-out hover:w-64 dark:border-gray-800 dark:bg-gray-900">
      {/* Logo 区 */}
      <div className="flex h-24 items-center gap-3 overflow-hidden px-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-xl font-bold text-white shadow-primary">
          越
        </div>
        <div className="whitespace-nowrap text-lg font-extrabold text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-indigo-400">
          越学越会
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex flex-1 flex-col gap-2 px-3">
        {NAV_ITEMS.map((item) => {
          if (item.requiresPractice && !hasPracticeForLang(currentLang)) return null

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : normalClass}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">{item.icon}</span>
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* 语言 + 主题切换 */}
      <div className="border-t-2 border-subtle px-3 py-2 dark:border-gray-800">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      {/* 用户区 */}
      <div className="overflow-hidden border-t-2 border-subtle p-3 dark:border-gray-800">
        {user ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{user}</div>
              <button type="button" onClick={() => logout()} className="text-xs text-gray-400 transition hover:text-red-500">
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-bold text-gray-600 transition hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">🔑</span>
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">登录</span>
          </button>
        )}
      </div>
    </aside>
  )
}
