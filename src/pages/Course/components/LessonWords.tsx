import useSpeech from '@/hooks/useSpeech'
import { ttsLangOf } from '@/lib/ttsLang'
import { currentLanguageAtom } from '@/store/language'
import type { CourseWord } from '@/typings/course'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

interface Props {
  words: CourseWord[]
}

function WordRow({ word, lang }: { word: CourseWord; lang: string }) {
  const opts = useMemo(() => ({ lang: ttsLangOf(lang) }), [lang])
  const { speak } = useSpeech(word.name, opts)

  return (
    <li className="flex items-center justify-between p-3">
      <div>
        <div className="font-medium">{word.name}</div>
        <div className="text-sm text-gray-500">{word.trans.join('；')}</div>
      </div>
      <button type="button" className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600" onClick={() => speak(true)}>
        🔊
      </button>
    </li>
  )
}

export default function LessonWords({ words }: Props) {
  const lang = useAtomValue(currentLanguageAtom)

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">② 新单词</h2>
      <ul className="divide-y rounded-lg border">
        {words.map((w) => (
          <WordRow key={w.id} word={w} lang={lang} />
        ))}
      </ul>
    </section>
  )
}
