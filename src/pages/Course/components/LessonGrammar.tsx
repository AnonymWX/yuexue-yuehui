import type { CourseGrammar } from '@/typings/course'

interface Props {
  grammar: CourseGrammar[]
}

export default function LessonGrammar({ grammar }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">⑤ 语法说明</h2>
      <div className="space-y-4">
        {grammar.map((g, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="font-medium">{g.point}</div>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{g.explain}</div>
            {g.examples.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {g.examples.map((ex, j) => (
                  <li key={j}>{ex}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
