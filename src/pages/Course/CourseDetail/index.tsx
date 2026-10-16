// src/pages/Course/CourseDetail/index.tsx
import { useCourse, useSentences } from '../hooks/useCourse'
import LessonPlayer from '../player/LessonPlayer'
import { prefetchCloudTTSBatch } from '@/lib/cloudTTS'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function CourseDetail() {
  const {
    stage: stageId,
    theme: themeId,
    courseId,
  } = useParams<{
    stage: string
    theme: string
    courseId: string
  }>()

  const currentLang = useAtomValue(currentLanguageAtom) // ⬅️ 语言来自 store，不再写死 'vi'

  const { course, loading, error } = useCourse(currentLang, themeId, courseId)
  const { sentences } = useSentences(currentLang)

  // ⭐ 预加载本节课所有单词的音频（后台悄悄进行，不阻塞渲染）
  useEffect(() => {
    if (!course?.words?.length || !currentLang) return

    const items = course.words.map((w) => ({ text: w.name, lang: currentLang })).filter((it) => !!it.text)

    if (items.length === 0) return

    // 延迟 500ms 再预加载，避免和页面首屏渲染抢带宽
    const timer = window.setTimeout(() => {
      prefetchCloudTTSBatch(items)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [course, currentLang])

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-red-500">加载失败：{error}</div>
  if (!course || !themeId) return <div className="p-8 text-center text-gray-500">课程未找到</div>

  const lessonSentences = sentences.filter((s) => course.sentences.includes(s.id))

  return <LessonPlayer key={course.id} course={course} sentences={lessonSentences} lang={currentLang} theme={themeId} />
}
