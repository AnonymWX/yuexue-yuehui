import LangFillInput, { isLangMatch } from './LangFillInput'
import useSpeech from '@/hooks/useSpeech'
import { ttsLangOf } from '@/lib/ttsLang'
import { currentLanguageAtom } from '@/store/language'
import type { CourseWord } from '@/typings/course'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

const HINT_TEXT: Record<string, { method: string }> = {
  vi: { method: '用 Telex 输入越南语单词。' },
  ja: { method: '用罗马字输入日语假名。' },
  ko: { method: '用 2-beolsik 输入韩字。' },
  en: { method: '输入英文单词。' },
}

function WordCard({ word, lang, onDone }: { word: CourseWord; lang: string; onDone: () => void }) {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const opts = useMemo(() => ({ lang: ttsLangOf(lang) }), [lang])
  const { speak, cancel } = useSpeech(word.name, opts)

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
    if (isLangMatch(lang, word.name, v)) setStatus('correct')
  }

  const handleCheck = () => {
    if (status === 'correct' || !raw.trim()) return
    if (isLangMatch(lang, word.name, raw)) {
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
        'rounded-3xl border bg-white p-8 transition dark:bg-gray-900 ' +
        (status === 'wrong'
          ? 'border-red-300 dark:border-red-800'
          : status === 'correct'
          ? 'border-green-300 dark:border-green-800'
          : 'border-gray-100 dark:border-gray-800')
      }
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="text-sm text-gray-500">{word.trans.join('；')}</div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{word.name}</span>
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

      <LangFillInput
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

interface Props {
  words: CourseWord[]
  onNext: () => void
}

export default function StepWords({ words, onNext }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length === 0) onNext()
  }, [words.length, onNext])

  if (words.length === 0) return null

  const hint = HINT_TEXT[lang] ?? HINT_TEXT.en

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>第 2 步 · 新单词</span>
        <span>
          {index + 1} / {words.length}
        </span>
      </div>
      <h2 className="mb-2 text-2xl font-bold">新单词</h2>
      <p className="mb-8 text-sm text-gray-500">看中文意思，{hint.method}</p>

      <WordCard
        key={index}
        word={words[index]}
        lang={lang}
        onDone={() => {
          if (index + 1 >= words.length) onNext()
          else setIndex((i) => i + 1)
        }}
      />
    </div>
  )
}
