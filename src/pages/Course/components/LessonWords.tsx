import type { CourseWord } from '@/typings/course'

interface Props {
  words: CourseWord[]
}

export default function LessonWords({ words }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">② 新单词</h2>
      <ul className="divide-y rounded-lg border">
        {words.map((w) => (
          <li key={w.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{w.name}</div>
              <div className="text-sm text-gray-500">{w.trans.join('；')}</div>
            </div>
            <button
              type="button"
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
              onClick={() => {
                if ('speechSynthesis' in window) {
                  const u = new SpeechSynthesisUtterance(w.name)
                  u.lang = 'vi-VN'
                  speechSynthesis.speak(u)
                }
              }}
            >
              🔊
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
