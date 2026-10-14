import type { Sentence } from '@/typings/sentence'

interface Props {
  sentences: Sentence[]
}

export default function LessonSentences({ sentences }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">③ 重点句子</h2>
      <ul className="space-y-3">
        {sentences.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{s.text}</div>
              <button
                type="button"
                className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(s.text)
                    u.lang = 'vi-VN'
                    speechSynthesis.speak(u)
                  }
                }}
              >
                🔊
              </button>
            </div>
            <div className="mt-1 text-sm text-gray-500">{s.translation}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
