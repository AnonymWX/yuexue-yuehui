import TelexFillInput, { isSentenceMatch } from './TelexFillInput'
import useSpeech from '@/hooks/useSpeech'
import type { Sentence } from '@/typings/sentence'
import { useEffect, useState } from 'react'

const VI_OPTION = { lang: 'vi-VN' }

interface Props {
  sentences: Sentence[]
  onNext: () => void
}

function DictationCard({ sentence, onDone }: { sentence: Sentence; onDone: () => void }) {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showHint, setShowHint] = useState(false)
  const { speak, cancel } = useSpeech(sentence.text, VI_OPTION)

  useEffect(() => {
    speak(true)
    return () => cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak])

  useEffect(() => {
    if (status !== 'correct') return
    const t = setTimeout(() => onDone(), 700)
    return () => clearTimeout(t)
  }, [status, onDone])

  const handleChange = (v: string) => {
    setRaw(v)
    if (status === 'correct') return
    if (isSentenceMatch(sentence.text, v)) setStatus('correct')
  }

  const handleCheck = () => {
    if (status === 'correct' || !raw.trim()) return
    if (isSentenceMatch(sentence.text, raw)) {
      setStatus('correct')
    } else {
      setStatus('wrong')
      speak(true)
      setTimeout(() => {
        setRaw('')
        setStatus('idle')
      }, 600)
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => speak(true)}
          aria-label="播放"
          className="rounded-full bg-indigo-50 p-6 text-3xl transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
        >
          🔊
        </button>
        <div className="mt-4 text-xs text-gray-400">点击可重复播放</div>

        <button type="button" onClick={() => setShowHint((v) => !v)} className="mt-4 text-xs text-blue-500 hover:underline">
          {showHint ? '隐藏提示' : '提示'}
        </button>

        {showHint && (
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm dark:bg-amber-900/20">
            <div className="font-medium text-amber-800 dark:text-amber-200">{sentence.text}</div>
            <div className="mt-1 text-amber-700 dark:text-amber-300">{sentence.translation}</div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <TelexFillInput
          target={sentence.text}
          value={raw}
          onChange={handleChange}
          onEnter={handleCheck}
          disabled={status === 'correct'}
          autoFocus
        />
      </div>

      {status === 'correct' && <div className="mt-4 text-sm text-green-600">✅ 正确</div>}
      {status === 'wrong' && <div className="mt-4 text-sm text-red-500">❌ 不对，再试一次</div>}

      <button
        type="button"
        onClick={handleCheck}
        disabled={status === 'correct' || !raw.trim()}
        className="mt-8 w-full rounded-2xl bg-indigo-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800"
      >
        检查
      </button>
    </>
  )
}

export default function StepDictation({ sentences, onNext }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (sentences.length === 0) onNext()
  }, [sentences.length, onNext])

  if (sentences.length === 0) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>第 7 步 · 听写</span>
        <span>
          {index + 1} / {sentences.length}
        </span>
      </div>
      <h2 className="mb-2 text-2xl font-bold">听写句子</h2>
      <p className="mb-8 text-sm text-gray-500">听句子，用 Telex 输入完整内容（标点前加空格）。</p>

      <DictationCard
        key={index}
        sentence={sentences[index]}
        onDone={() => {
          if (index + 1 >= sentences.length) onNext()
          else setIndex((i) => i + 1)
        }}
      />
    </div>
  )
}
