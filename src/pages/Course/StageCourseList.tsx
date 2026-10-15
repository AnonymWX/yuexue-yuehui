// src/pages/Course/StageCourseList.tsx
import { useStage, useThemesByStage } from './hooks/useCourse'
import { useParams, useNavigate } from 'react-router-dom'

export default function StageCourseList() {
  const { stage: stageId } = useParams<{ stage: string }>()
  const navigate = useNavigate()
  const stage = useStage(stageId)
  const themes = useThemesByStage(stageId)

  if (!stage) {
    return (
      <div className="p-6 text-center text-gray-500">
        阶段未找到：{stageId}
        <br />
        <button onClick={() => navigate('/course')} className="mt-4 text-primary hover:underline">
          ← 返回阶段列表
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <button onClick={() => navigate('/course')} className="mb-4 text-sm text-primary hover:underline">
        ← 返回阶段列表
      </button>

      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold text-primary">{stage.title}</h1>
          <span className="text-lg text-gray-500">({stage.cefr})</span>
        </div>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{stage.titleVi}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme, idx) => (
          <div
            key={theme.id}
            onClick={() => navigate(`/course/${stageId}/${theme.id}`)}
            className="group cursor-pointer rounded-lg border border-subtle bg-page p-5 transition-all hover:border-primary hover:shadow-primary/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">主题 {String(idx + 1).padStart(2, '0')}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{theme.courses.length} 课</span>
            </div>
            <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">{theme.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{theme.titleVi}</p>
          </div>
        ))}
      </div>

      {themes.length === 0 && <div className="py-20 text-center text-gray-400">该阶段暂无主题</div>}
    </div>
  )
}
