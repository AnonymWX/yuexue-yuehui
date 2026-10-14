import { createTelexEngine } from '@/engines/telex'
import type { CourseTelex } from '@/typings/course'
import { useEffect, useState } from 'react'

interface Props {
  telex: CourseTelex[]
}

type Status = 'idle' | 'correct' | 'wrong'

export default function LessonTelex({ telex }: Props) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const current = telex[index]

  useEffect(() => {
    setInput('')
    setStatus('idle')
  }, [index])

  if (telex.length === 0 || !current) return null

  const check = () => {
    const typed = input.trim().toLowerCase()
    if (typed.length === 0) {
      setStatus('wrong')
      return
    }

    const engine = createTelexEngine(current.target)
    for (const ch of typed) {
      const result = engine.feed(ch)
      if (result.status === 'reject') {
        setStatus('wrong')
        return
      }
    }

    if (engine.isFinished()) {
      setStatus('correct')
    } else {
      setStatus('wrong')
    }
  }

  const next = () => {
    setIndex((i) => (i + 1) % telex.length)
  }

  const isLast = index === telex.length - 1

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">⑧ Telex 打字</h2>
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm text-gray-500">
          第 {index + 1} / {telex.length} 个
        </div>

        <div className="mb-4">
          <div className="text-2xl font-medium">{current.target}</div>
          {current.rule && <div className="mt-1 text-sm text-gray-500">规则：{current.rule}</div>}
        </div>

        <div className="text-sm text-gray-500">请输入对应的 Telex 按键：</div>
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') check()
            }}
            className="flex-1 rounded border px-3 py-2 dark:bg-gray-800"
            placeholder="例如 chaof 或 chafo"
            autoFocus
          />
          <button type="button" onClick={check} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            检查
          </button>
        </div>

        {status === 'correct' && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-green-600">✅ 正确</span>
            {!isLast ? (
              <button type="button" onClick={next} className="text-blue-500 underline">
                下一题 →
              </button>
            ) : (
              <span className="text-gray-500">已完成</span>
            )}
          </div>
        )}

        {status === 'wrong' && <div className="mt-3 text-sm text-red-500">❌ 不对，再试一次</div>}
      </div>
    </section>
  )
}
