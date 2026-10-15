import { useAllThemes } from '../hooks/useCourse'
// ⬅️ 改这里：用 useAllThemes 替换 useCourseStructure
import StepDictation from '../steps/StepDictation'
import StepExplanation from '../steps/StepExplanation'
import StepGoal from '../steps/StepGoal'
import StepGrammar from '../steps/StepGrammar'
import StepListening from '../steps/StepListening'
import StepQuiz from '../steps/StepQuiz'
import StepSentences from '../steps/StepSentences'
import StepWords from '../steps/StepWords'
import FinishScreen from './FinishScreen'
import PlayerTopBar from './PlayerTopBar'
import ResumeDialog from './ResumeDialog'
import { useLessonProgress } from './useLessonProgress'
import type { Course } from '@/typings/course'
import type { Sentence } from '@/typings/sentence'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TOTAL_STEPS = 8

const STEP_LABELS = ['① 本课目标', '② 新单词', '③ 重点句子', '④ 句子理解', '⑤ 语法说明', '⑥ 听力选择', '⑦ 听写', '⑧ 复习测试']

interface Props {
  course: Course
  sentences: Sentence[]
  lang: string
  theme: string
}

export default function LessonPlayer({ course, sentences, lang, theme }: Props) {
  const navigate = useNavigate()
  const { progress, loaded, save, clear } = useLessonProgress(course.id)

  // ⬇️ 改这里：获取所有主题（包含 stage 字段）
  const allThemes = useAllThemes()

  // ⬇️ 改这里：扁平化所有课程，用于精准查找“下一课”（支持跨主题、跨阶段）
  const flatCourses = useMemo(() => {
    return allThemes.flatMap((t) =>
      t.courses.map((c) => ({
        id: c.id,
        title: c.title,
        file: c.file,
        stageId: t.stage,
        themeId: t.id,
        themeTitle: t.title,
      })),
    )
  }, [allThemes])

  // ⬇️ 改这里：计算下一课
  const nextCourse = useMemo(() => {
    const currentIndex = flatCourses.findIndex((c) => c.id === course.id)
    if (currentIndex >= 0 && currentIndex + 1 < flatCourses.length) {
      const next = flatCourses[currentIndex + 1]
      return {
        entry: next,
        stageId: next.stageId,
        themeId: next.themeId,
        themeTitle: next.themeTitle,
      }
    }
    return null
  }, [flatCourses, course.id])

  // ⬇️ 改这里：生成下一课的三段式路由 URL
  const nextCourseUrl = useMemo(() => {
    if (!nextCourse) return null
    return `/course/${nextCourse.stageId}/${nextCourse.themeId}/${nextCourse.entry.id}`
  }, [nextCourse])

  // ⬇️ 改这里：当前课的标签（主题名 · 第N课）
  const courseLabel = useMemo(() => {
    const currentTheme = allThemes.find((t) => t.id === theme)
    if (!currentTheme) return null
    const idx = currentTheme.courses.findIndex((c) => c.id === course.id)
    if (idx === -1) return null
    return `${currentTheme.title} · 第${idx + 1}课`
  }, [allThemes, theme, course.id])

  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [resumeAtStep, setResumeAtStep] = useState(0)

  const didInitRef = useRef(false)

  // save 用 ref 存，避免依赖变化导致 effect 重跑
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

  // 初始化：从 localStorage 恢复一次
  useEffect(() => {
    if (didInitRef.current) return
    if (!loaded) return
    didInitRef.current = true

    if (progress?.finished) {
      setFinished(true)
      return
    }
    if (progress && progress.currentStep > 0) {
      setStep(progress.currentStep)
      setResumeAtStep(progress.currentStep)
      setShowResume(true)
    }
  }, [loaded, progress])

  // 唯一入口：同时更新 state + localStorage
  const commit = useCallback((nextStep: number, nextFinished: boolean) => {
    setStep(nextStep)
    setFinished(nextFinished)
    saveRef.current(nextStep, nextFinished)
  }, [])

  // ⬇️ 改这里：退出时跳回带 stage 的主题列表页
  const handleExit = useCallback(() => {
    saveRef.current(step, finished)
    const currentThemeMeta = allThemes.find((t) => t.id === theme)
    const stageId = currentThemeMeta?.stage || 'a1' // 兜底 a1
    navigate(`/course/${stageId}/${theme}`)
  }, [step, finished, navigate, theme, allThemes])

  const goNext = useCallback(() => {
    const next = step + 1
    if (next >= TOTAL_STEPS) {
      commit(TOTAL_STEPS, true)
      return
    }
    commit(next, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, commit])

  const handleRestart = useCallback(() => {
    clear()
    setStep(0)
    setFinished(false)
    setShowResume(false)
    setResumeAtStep(0)
  }, [clear])

  if (finished) {
    return (
      <FinishScreen
        courseTitle={course.title}
        onRestart={handleRestart}
        words={course.words}
        sentences={sentences}
        grammar={course.grammar}
        exercises={course.exercises}
        nextCourseUrl={nextCourseUrl}
        nextCourseTitle={nextCourse ? `${nextCourse.themeTitle} · ${nextCourse.entry.title}` : undefined}
      />
    )
  }

  const stepLabel = STEP_LABELS[step] ?? ''

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepGoal goals={course.goals} onNext={goNext} courseLabel={courseLabel} />
      case 1:
        return <StepWords words={course.words} onNext={goNext} />
      case 2:
        return <StepSentences sentences={sentences} onNext={goNext} />
      case 3:
        return <StepExplanation sentences={sentences} onNext={goNext} />
      case 4:
        return <StepGrammar grammar={course.grammar} onNext={goNext} />
      case 5:
        return <StepListening sentences={sentences} onNext={goNext} />
      case 6:
        return <StepDictation sentences={sentences} onNext={goNext} />
      case 7:
        return <StepQuiz exercises={course.exercises} onNext={goNext} />
      default:
        return <PlaceholderStep label={stepLabel} onNext={goNext} />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PlayerTopBar total={TOTAL_STEPS} current={step} onExit={handleExit} />
      <div className="flex-1 px-6 py-8">{renderStep()}</div>

      {showResume && (
        <ResumeDialog
          currentStep={resumeAtStep + 1}
          total={TOTAL_STEPS}
          onContinue={() => setShowResume(false)}
          onRestart={handleRestart}
        />
      )}

      {/* DEV 调试面板：只在 npm run dev 时显示 */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-xs shadow-lg dark:border-yellow-800 dark:bg-yellow-900/30">
          <div className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">DEV 调试</div>
          <div className="max-w-[220px] rounded bg-white p-2 font-mono text-[10px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <div>
              屏幕 step = <b>{step}</b>（第 {step + 1} 步）
            </div>
            <div>
              本地存值 = <b>{progress?.currentStep ?? '无'}</b>
            </div>
            <div>finished = {String(progress?.finished ?? false)}</div>
          </div>
          <button
            type="button"
            onClick={() => commit(step, true)}
            className="rounded bg-indigo-500 px-3 py-1.5 text-white hover:bg-indigo-600"
          >
            一键完成本课
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
          >
            跳到下一步
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
          >
            清空进度重来
          </button>
        </div>
      )}
    </div>
  )
  function PlaceholderStep({ label, onNext }: { label: string; onNext: () => void }) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-2 text-xs text-gray-400">（此步尚未接入）</div>
        <div className="mb-6 text-lg font-medium">{label}</div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-500">第 3 批接入实际内容</div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="mt-8 w-full rounded-2xl border border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          跳过本步（临时）
        </button>
      </div>
    )
  }
}
