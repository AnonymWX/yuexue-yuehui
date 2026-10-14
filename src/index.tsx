import Layout from './components/AppLayout'
import Loading from './components/Loading'
import RequireAuth from './components/RequireAuth'
import RequirePractice from './components/RequirePractice'
import './index.css'
import { useLessonProgressInit } from './pages/Course/player/useLessonProgress'
import DrillPage from './pages/Drill'
import { usePracticeProgressInit } from './pages/Drill/useDrillProgress'
import { ErrorBook } from './pages/ErrorBook'
import { FriendLinks } from './pages/FriendLinks'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import { useAuthInit } from './pages/Login/useAuth'
import MobilePage from './pages/Mobile'
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
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const CourseHomePage = lazy(() => import('./pages/Course'))
const CourseListPage = lazy(() => import('./pages/Course/LanguageCourseList'))
const CourseDetailPage = lazy(() => import('./pages/Course/CourseDetail'))
const ReviewPage = lazy(() => import('./pages/Review'))
const PracticePage = lazy(() => import('./pages/Practice'))

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
      <BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
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
                  <Route
                    path="/course"
                    element={
                      <RequireAuth>
                        <CourseHomePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/course/:lang/:theme"
                    element={
                      <RequireAuth>
                        <CourseListPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/course/:lang/:theme/:no"
                    element={
                      <RequireAuth>
                        <CourseDetailPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/review"
                    element={
                      <RequireAuth>
                        <ReviewPage />
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
