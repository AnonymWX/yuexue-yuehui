import useSpeech from '@/hooks/useSpeech'
import type { Sentence } from '@/typings/sentence'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  sentences: Sentence[]
}

function PlayButton({ text }: { text: string }) {
  const opts = useMemo(() => ({ lang: 'vi-VN', rate: 0.9 }), [])
  const { speak } = useSpeech(text, opts)
  return (
    <button type="button" onClick={() => speak(true)} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
      🔊 播放
    </button>
  )
}

export default function LessonListening({ sentences }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<Sentence[]>([])

  const current = sentences[index]

  useEffect(() => {
    if (sentences.length === 0 || !current) return
    const others = sentences.filter((s) => s.id !== current.id)
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
    const all = [current, ...shuffled].sort(() => Math.random() - 0.5)
    setOptions(all)
    setSelected(null)
  }, [index, sentences, current])

  if (sentences.length === 0 || !current) return null

  const done = selected !== null
  const isCorrect = selected === current.id

  const next = () => {
    setIndex((i) => (i + 1) % sentences.length)
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">⑥ 听力选择</h2>
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-3">
          <PlayButton text={current.text} />
          <div className="text-sm text-gray-500">
            第 {index + 1} / {sentences.length} 句
          </div>
        </div>

        <div className="mb-3 text-sm text-gray-500">请选出你听到的句子：</div>

        <div className="space-y-2">
          {options.map((opt) => {
            const isThis = opt.id === current.id
            const picked = selected === opt.id
            let cls = 'rounded border px-3 py-2 cursor-pointer transition '
            if (!done) {
              cls += 'hover:bg-gray-50 dark:hover:bg-gray-800'
            } else if (isThis) {
              cls += 'border-green-500 bg-green-50 dark:bg-green-900/20'
            } else if (picked) {
              cls += 'border-red-500 bg-red-50 dark:bg-red-900/20'
            } else {
              cls += 'opacity-60'
            }
            return (
              <div
                key={opt.id}
                className={cls}
                onClick={() => {
                  if (!done) setSelected(opt.id)
                }}
              >
                {opt.text}
              </div>
            )
          })}
        </div>

        {done && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            {isCorrect ? (
              <span className="text-green-600">✅ 正确</span>
            ) : (
              <span className="text-red-500">❌ 正确答案：{current.text}</span>
            )}
            <button type="button" onClick={next} className="text-blue-500 underline">
              下一句 →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
