import type { ReviewWord } from './useDailyReview'
import useSpeech from '@/hooks/useSpeech'
import TelexFillInput, { isTelexMatch } from '@/pages/Course/steps/TelexFillInput'
import { useEffect, useState } from 'react'

const VI_OPTION = { lang: 'vi-VN' }

interface Props {
  word: ReviewWord
  onDone: () => void
}

export default function ReviewTypeCard({ word, onDone }: Props) {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const { speak, cancel } = useSpeech(word.name, VI_OPTION)

  // 挂载后自动播一次；卸载时取消
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
    if (isTelexMatch(word.name, v)) setStatus('correct')
  }

  const handleCheck = () => {
    if (status === 'correct' || !raw.trim()) return
    if (isTelexMatch(word.name, raw)) {
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
    <div
      className={
        'rounded-3xl border-2 bg-white p-8 transition dark:bg-gray-900 ' +
        (status === 'wrong'
          ? 'border-red-300 dark:border-red-800'
          : status === 'correct'
          ? 'border-green-300 dark:border-green-800'
          : 'border-subtle dark:border-gray-800')
      }
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="text-sm text-gray-500">请用越南语输入下面中文对应的单词</div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{word.trans.join('；')}</span>
          <button
            type="button"
            onClick={() => speak(true)}
            aria-label="播放"
            className="rounded-full bg-indigo-50 p-2 text-xl transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
          >
            🔊
          </button>
        </div>
      </div>

      <TelexFillInput
        target={word.name}
        value={raw}
        onChange={handleChange}
        onEnter={handleCheck}
        disabled={status === 'correct'}
        autoFocus
      />

      {status === 'correct' && <div className="mt-4 text-sm text-green-600">✅ 正确</div>}
      {status === 'wrong' && <div className="mt-4 text-sm text-red-500">❌ 不对，再试一次</div>}
    </div>
  )
}
