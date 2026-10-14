import type { PropsWithChildren } from 'react'
import type React from 'react'
import { NavLink } from 'react-router-dom'

interface Props {
  /**
   * 是否显示通用导航（首页 / 课程 / 单词）。
   * - Home / Course 页传 true
   * - Typing 页不传，保持原有行为
   */
  showNav?: boolean
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  'px-3 py-1.5 rounded-lg text-sm font-medium transition ' +
  (isActive ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700')

const Header: React.FC<PropsWithChildren<Props>> = ({ children, showNav = false }) => {
  return (
    <header className="container z-20 mx-auto w-full px-10 py-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
        {/* 左上角标题：纯文字，点击不跳转 */}
        <div className="flex items-center text-2xl font-bold text-indigo-500 lg:text-4xl">
          <h1>越学越会</h1>
        </div>
        <nav className="my-card on element flex w-auto flex-wrap content-center items-center justify-end gap-2 rounded-xl bg-white p-4 transition-colors duration-300 dark:bg-gray-800">
          {showNav && (
            <>
              <NavLink to="/" end className={navItemClass}>
                首页
              </NavLink>
              <NavLink to="/course" className={navItemClass}>
                课程
              </NavLink>
              <NavLink to="/typing" className={navItemClass}>
                单词
              </NavLink>
            </>
          )}
          {children}
        </nav>
      </div>
    </header>
  )
}

export default Header
