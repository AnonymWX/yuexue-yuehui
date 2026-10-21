import Sidebar from './AppLayout/Sidebar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { hasPracticeForLang } from '@/pages/Drill/useDrillProgress'
import { useAuth } from '@/pages/Login/useAuth'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  requiresPractice?: boolean
}

// 抽屉里的完整导航（和 Sidebar 一致）
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/practice', label: '练习', icon: '🎓', requiresPractice: true },
  { to: '/course', label: '课程', icon: '📚' },
  { to: '/review', label: '复习', icon: '🎯' },
  { to: '/typing', label: '单词', icon: '⌨️' },
]

// 手机端底部导航（只放最核心的 4 个）
const BOTTOM_TABS: NavItem[] = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/course', label: '课程', icon: '📚' },
  { to: '/review', label: '复习', icon: '🎯' },
  { to: '/practice', label: '练习', icon: '🎓', requiresPractice: true },
]

const activeClass = 'bg-indigo-500 text-white shadow-primary'
const normalClass = 'text-gray-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30'

export default function Layout({ children }: { children?: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const currentLang = useAtomValue(currentLanguageAtom)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F0] dark:bg-gray-900">
      {/* ================= 1. 桌面端 Sidebar（md 及以上显示） ================= */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ================= 2. 手机端顶部 Header ================= */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b-2 border-subtle bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-gray-700 transition hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30"
          aria-label="打开菜单"
        >
          ☰
        </button>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">越学越会</span>
        <div className="w-10" />
      </header>

      {/* ================= 3. 手机端抽屉（点击汉堡菜单滑出） ================= */}
      {isDrawerOpen && <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsDrawerOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-white transition-transform duration-300 dark:bg-gray-900 md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between border-b-2 border-subtle px-4 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-lg font-bold text-white shadow-primary">
              越
            </div>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">越学越会</span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-3xl leading-none text-gray-400 transition hover:bg-indigo-50 hover:text-gray-600 dark:hover:bg-indigo-900/30"
            aria-label="关闭菜单"
          >
            &times;
          </button>
        </div>

        {/* 抽屉导航 */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            if (item.requiresPractice && !hasPracticeForLang(currentLang)) return null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${isActive ? activeClass : normalClass}`
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* 语言 + 主题切换（你原来的组件，直接搬过来） */}
        <div className="border-t-2 border-subtle px-3 py-2 dark:border-gray-800">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>

        {/* 用户区（你原来的逻辑，直接搬过来） */}
        <div className="border-t-2 border-subtle p-3 dark:border-gray-800">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                {user.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{user}</div>
                <button type="button" onClick={() => logout()} className="text-xs text-gray-400 transition hover:text-red-500">
                  退出登录
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false)
                navigate('/login')
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-600 transition hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/30"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">🔑</span>
              <span>登录</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= 4. 主内容区 ================= */}
      <main className="flex-1 overflow-y-auto pb-16 pt-14 md:pb-0 md:pl-20 md:pt-0">
        <Outlet />
      </main>

      {/* ================= 5. 手机端底部导航栏 ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t-2 border-subtle bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
        {BOTTOM_TABS.map((tab) => {
          if (tab.requiresPractice && !hasPracticeForLang(currentLang)) return null
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] transition ${
                  isActive ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
