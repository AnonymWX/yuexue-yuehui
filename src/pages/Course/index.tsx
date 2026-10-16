// src/pages/Course/index.tsx
import { useStages } from './hooks/useCourse'
import { useNavigate } from 'react-router-dom'

export default function CourseIndex() {
  const navigate = useNavigate()
  const stages = useStages()

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-3xl font-bold text-primary">选择学习阶段</h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">选择学习阶段 · Choose your CEFR level</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {stages.map((stage) => (
          <div
            key={stage.id}
            onClick={() => navigate(`/course/${stage.id}`)}
            className="group cursor-pointer rounded-xl border border-subtle bg-page p-6 shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-primary"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-3xl font-extrabold text-primary">{stage.cefr}</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{stage.themes.length} 个主题</span>
            </div>
            <h2 className="mb-1 text-xl font-semibold transition-colors group-hover:text-primary">{stage.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stage.titleVi}</p>
            <div className="mt-4 text-xs text-gray-400">点击进入 →</div>
          </div>
        ))}
      </div>

      {stages.length === 0 && <div className="py-20 text-center text-gray-400">暂无阶段数据，请检查 public/courses/index.json</div>}
    </div>
  )
}
