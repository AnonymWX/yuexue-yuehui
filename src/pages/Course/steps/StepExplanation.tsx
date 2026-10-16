import { currentLanguageAtom } from '@/store/language'
import type { Sentence } from '@/typings/sentence'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  sentences: Sentence[]
  onNext: () => void
}

interface Token {
  w: string
  id: number
}

const HINT_TEXT: Record<string, string> = {
  vi: '把打乱的词排成正确的越南语句子。',
  ja: '把打乱的词排成正确的日语句子。',
  ko: '把打乱的词排成正确的韩语句子。',
  en: '把打乱的词排成正确的英文句子。',
}

/**
 * 按语言分词
 * - 日语没有空格，用 Intl.Segmenter('ja', { granularity: 'word' })
 * - 韩语 / 越南语同样用 Intl.Segmenter('word')
 * - 不支持 Segmenter 时 fallback 到空格拆分
 */
function segment(lang: string, text: string): string[] {
  if (lang === 'ja') {
    // 日语无空格：按字符拆，标点合并到前一个 token
    const chars = text.split('')
    const parts: string[] = []
    const PUNCT = /[。、！？「」『』（）【】…—～・]/
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      if (!c.trim()) continue
      if (PUNCT.test(c) && parts.length > 0) {
        parts[parts.length - 1] += c
      } else {
        parts.push(c)
      }
    }
    return parts
  }
  // 越南语 / 韩语 / 英语：按空格拆
  return text.split(/\s+/).filter(Boolean)
}

function ExplanationCard({ sentence, lang, onDone }: { sentence: Sentence; lang: string; onDone: () => void }) {
  const [picked, setPicked] = useState<Token[]>([])
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const tokens = useMemo<string[]>(() => segment(lang, sentence.text), [lang, sentence])

  const shuffled = useMemo<Token[]>(() => {
    return tokens.map((w, i) => ({ w, id: i })).sort(() => Math.random() - 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence, lang])

  useEffect(() => {
    if (picked.length === 0 || picked.length !== tokens.length) return
    const built = picked.map((p) => p.w).join(' ')
    const target = tokens.join(' ')
    if (built === target) {
      setFeedback('correct')
      const t = setTimeout(() => onDone(), 800)
      return () => clearTimeout(t)
    } else {
      setFeedback('wrong')
      const t = setTimeout(() => {
        setFeedback('idle')
        setPicked([])
      }, 900)
      return () => clearTimeout(t)
    }
  }, [picked, tokens, onDone])

  const usedIds = new Set(picked.map((p) => p.id))
  const locked = feedback !== 'idle'

  return (
    <>
      <div className="mb-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800/50">中文：{sentence.translation}</div>

      <div
        className={
          'mb-4 min-h-[64px] rounded-2xl border-2 border-dashed p-4 transition ' +
          (feedback === 'wrong'
            ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
            : feedback === 'correct'
            ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
            : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900')
        }
      >
        {picked.length === 0 ? (
          <span className="text-sm text-gray-400">点击下方词语排序</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {picked.map((t, i) => (
              <span key={`${t.id}-${i}`} className="rounded-xl bg-indigo-500 px-3 py-1.5 text-sm text-white">
                {t.w}
              </span>
            ))}
          </div>
        )}
      </div>

      {feedback === 'correct' && <div className="mb-3 text-sm text-green-600">✅ 正确</div>}
      {feedback === 'wrong' && <div className="mb-3 text-sm text-red-500">❌ 顺序不对，重新排一次</div>}

      <div className="flex flex-wrap gap-2">
        {shuffled.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (usedIds.has(t.id) || locked) return
              setPicked((prev) => [...prev, t])
            }}
            disabled={usedIds.has(t.id) || locked}
            className={
              'rounded-xl border px-3 py-1.5 text-sm transition ' +
              (usedIds.has(t.id)
                ? 'cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-600'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800')
            }
          >
            {t.w}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPicked([])}
        disabled={locked || picked.length === 0}
        className="mt-6 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        重排
      </button>
    </>
  )
}

export default function StepExplanation({ sentences, onNext }: Props) {
  const lang = useAtomValue(currentLanguageAtom)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (sentences.length === 0) onNext()
  }, [sentences.length, onNext])

  if (sentences.length === 0) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>第 4 步 · 句子理解</span>
        <span>
          {index + 1} / {sentences.length}
        </span>
      </div>
      <h2 className="mb-2 text-2xl font-bold">句子理解</h2>
      <p className="mb-8 text-sm text-gray-500">{HINT_TEXT[lang] ?? HINT_TEXT.en}</p>

      <ExplanationCard
        key={index}
        sentence={sentences[index]}
        lang={lang}
        onDone={() => {
          if (index + 1 >= sentences.length) onNext()
          else setIndex((i) => i + 1)
        }}
      />
    </div>
  )
}
