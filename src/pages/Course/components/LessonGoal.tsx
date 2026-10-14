interface Props {
  goals: string[]
}

export default function LessonGoal({ goals }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">① 本课目标</h2>
      <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
        {goals.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </section>
  )
}
