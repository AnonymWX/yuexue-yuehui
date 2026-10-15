import Layout from './components/AppLayout'
import Loading from './components/Loading'
import RequireAuth from './components/RequireAuth'
import RequirePractice from './components/RequirePractice'
import ToastHost from './components/ToastHost'
import './index.css'
import CourseIndex from './pages/Course'
import CourseDetail from './pages/Course/CourseDetail'
import LanguageCourseList from './pages/Course/LanguageCourseList'
import StageCourseList from './pages/Course/StageCourseList'
// 默认导入
import { useLessonProgressInit } from './pages/Course/player/useLessonProgress'
import DrillPage from './pages/Drill'
import { usePracticeProgressInit } from './pages/Drill/useDrillProgress'
import { ErrorBook } from './pages/ErrorBook'
import { FriendLinks } from './pages/FriendLinks'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import { useAuthInit } from './pages/Login/useAuth'
import MobilePage from './pages/Mobile'
import StatsPage from './pages/Review/StatsPage'
import { useWordReviewStatsInit } from './pages/Review/useDailyReview'
import TypingPage from './pages/Typing'
import { isDarkTheme, themeAtom } from '@/store/theme'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/noto-sans/400.css'
import '@fontsource/noto-sans/700.css'
import 'animate.css'
import { useAtomValue } from 'jotai'
import mixpanel from 'mixpanel-browser'
import process from 'process'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import 'react-app-polyfill/stable'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// 声明全局环境变量，防止 TS 报红（保留你原有的写法）
declare const REACT_APP_DEPLOY_ENV: string | undefined

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const ReviewPage = lazy(() => import('./pages/Review'))
const PracticePage = lazy(() => import('./pages/Practice'))

// 完全保留你原有的 mixpanel 初始化逻辑
if (process.env.NODE_ENV === 'production') {
  mixpanel.init('bdc492847e9340eeebd53cc35f321691')
} else {
  mixpanel.init('5474177127e4767124c123b2d7846e2a', { debug: true })
}

function Root() {
  useAuthInit()
  useLessonProgressInit()
  usePracticeProgressInit()
  useWordReviewStatsInit()

  const theme = useAtomValue(themeAtom)
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    if (isDarkTheme(theme)) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [theme])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 600
      if (!isMobile) {
        window.location.href = '/'
      }
      setIsMobile(isMobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <React.StrictMode>
      {/* 完全恢复你原有的 basename 写法 */}
      <BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
        <ToastHost />
        <Suspense fallback={<Loading />}>
          <Routes>
            {isMobile ? (
              <Route path="/*" element={<Navigate to="/mobile" />} />
            ) : (
              <>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<Layout />}>
                  <Route
                    index
                    element={
                      <RequireAuth>
                        <HomePage />
                      </RequireAuth>
                    }
                  />

                  {/* ===== 🎯 仅替换这里的课程路由为阶段系统 ===== */}
                  <Route
                    path="/course"
                    element={
                      <RequireAuth>
                        <CourseIndex />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/course/:stage"
                    element={
                      <RequireAuth>
                        <StageCourseList />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/course/:stage/:theme"
                    element={
                      <RequireAuth>
                        <LanguageCourseList />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/course/:stage/:theme/:courseId"
                    element={
                      <RequireAuth>
                        <CourseDetail />
                      </RequireAuth>
                    }
                  />
                  {/* ============================================ */}

                  <Route
                    path="/review"
                    element={
                      <RequireAuth>
                        <ReviewPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/review/stats"
                    element={
                      <RequireAuth>
                        <StatsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/typing"
                    element={
                      <RequireAuth>
                        <TypingPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/practice"
                    element={
                      <RequireAuth allowLocked>
                        <RequirePractice>
                          <PracticePage />
                        </RequirePractice>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/drill/:mode"
                    element={
                      <RequireAuth allowLocked>
                        <RequirePractice>
                          <DrillPage />
                        </RequirePractice>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/drill/:mode/:group"
                    element={
                      <RequireAuth allowLocked>
                        <RequirePractice>
                          <DrillPage />
                        </RequirePractice>
                      </RequireAuth>
                    }
                  />
                </Route>

                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/error-book" element={<ErrorBook />} />
                <Route path="/friend-links" element={<FriendLinks />} />
                <Route path="/*" element={<Navigate to="/" />} />
              </>
            )}
            <Route path="/mobile" element={<MobilePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

container && createRoot(container).render(<Root />)
