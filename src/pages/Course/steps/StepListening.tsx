import useSpeech from '@/hooks/useSpeech'
import { ttsLangOf } from '@/lib/ttsLang'
import { currentLanguageAtom } from '@/store/language'
import type { Sentence } from '@/typings/sentence'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

const HINT_TEXT: Record<string, string> = {
  vi: '听句子，选出正确的越南语文本。',
  ja: '听句子，选出正确的日语文本。',
  ko: '听句子，选出正确的韩语文本。',
  en: '听句子，选出正确的英文文本。',
}

interface Props {
  sentences: Sentence[]
  onNext: () => void
}

function ListeningCard({
  sentence,
  sentences,
  onDone,
  lang,
}: {
  sentence: Sentence
  sentences: Sentence[]
  onDone: () => void
  lang: string
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)

  const opts = useMemo(() => ({ lang: ttsLangOf(lang) }), [lang])
  const { speak, cancel } = useSpeech(sentence.text, opts)

  const options = useMemo<string[]>(() => {
    const pool = sentences.filter((s) => s.id !== sentence.id)
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3)
    const all = [sentence.text, ...distractors.map((s) => s.text)]
    return all.sort(() => Math.random() - 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence])

  useEffect(() => {
    speak(true)
    return () => cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak])

  const handlePick = (text: string) => {
    if (picked) return
    setPicked(text)
    if (text === sentence.text) {
      setTimeout(() => onDone(), 800)
    } else {
      setTimeout(() => setPicked(null), 800)
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
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            中文：{sentence.translation}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {options.map((opt) => {
          const isPicked = picked === opt
          const isCorrect = opt === sentence.text
          let cls = 'block w-full rounded-2xl border px-4 py-4 text-left text-base transition '
          if (isPicked && isCorrect) cls += 'border-green-500 bg-green-50 dark:bg-green-900/20'
          else if (isPicked && !isCorrect) cls += 'border-red-500 bg-red-50 dark:bg-red-900/20'
          else cls += 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          return (
            <button key={opt} type="button" className={cls} onClick={() => handlePick(opt)} disabled={!!picked}>
              {opt}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function StepListening({ sentences, onNext }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (sentences.length === 0) onNext()
  }, [sentences.length, onNext])

  if (sentences.length === 0) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>第 6 步 · 听力选择</span>
        <span>
          {index + 1} / {sentences.length}
        </span>
      </div>
      <h2 className="mb-2 text-2xl font-bold">听力选择</h2>
      <p className="mb-8 text-sm text-gray-500">{HINT_TEXT[lang] ?? HINT_TEXT.en}</p>

      <ListeningCard
        key={index}
        sentence={sentences[index]}
        sentences={sentences}
        lang={lang}
        onDone={() => {
          if (index + 1 >= sentences.length) onNext()
          else setIndex((i) => i + 1)
        }}
      />
    </div>
  )
}
