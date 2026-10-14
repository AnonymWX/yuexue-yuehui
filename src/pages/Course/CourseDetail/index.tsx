import { useCourse, useSentences } from '../hooks/useCourse'
import LessonPlayer from '../player/LessonPlayer'
import { useParams } from 'react-router-dom'

export default function CourseDetail() {
  const { lang, theme, no } = useParams()
  const { course, loading, error } = useCourse(lang, theme, no)
  const { sentences } = useSentences(lang)

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-red-500">加载失败：{error}</div>
  if (!course || !lang || !theme) return null

  const lessonSentences = sentences.filter((s) => course.sentences.includes(s.id))

  return <LessonPlayer course={course} sentences={lessonSentences} lang={lang} theme={theme} />
}
