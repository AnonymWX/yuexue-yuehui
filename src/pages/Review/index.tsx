import ReviewChoiceCard from './ReviewChoiceCard'
import ReviewTypeCard from './ReviewTypeCard'
import { useDailyReview } from './useDailyReview'
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

const CHOICE_COUNT = 5

export default function ReviewPage() {
  const navigate = useNavigate()
  const lang = useAtomValue(currentLanguageAtom)
  const { state, words, loading, hasEnough, markDone, markWrong, restart } = useDailyReview(lang)

  const currentWord = state && state.done < state.total ? words[state.done] : null

  return (
    <div className="px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* ⬇️ 新增：统计入口 */}
        <div className="mb-6 flex items-center justify-end">
          <Link to="/review/stats" className="text-sm text-indigo-600 hover:underline">
            查看统计 →
          </Link>
        </div>

        {loading && <div className="text-center text-gray-400">加载中…</div>}

        {!loading && !hasEnough && (
          <div className="rounded-3xl border-2 border-subtle bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 text-4xl">📚</div>
            <div className="mb-2 text-lg font-medium">还没有足够的单词</div>
            <p className="mb-6 text-sm text-gray-500">今日复习需要至少 10 个学过的单词。先去完成课程吧。</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white shadow-primary transition hover:brightness-95"
            >
              回首页
            </button>
          </div>
        )}

        {!loading && hasEnough && state && state.done >= state.total && (
          <div className="rounded-3xl border-2 border-green-200 bg-white p-10 text-center dark:border-green-800 dark:bg-gray-900">
            <div className="mb-3 text-4xl">✅</div>
            <div className="mb-2 text-lg font-medium">今日已完成</div>
            <p className="mb-6 text-sm text-gray-500">明天再来</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="rounded-2xl border-2 border-subtle px-6 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                再练一轮
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white shadow-primary transition hover:brightness-95"
              >
                回首页
              </button>
            </div>
          </div>
        )}

        {!loading && hasEnough && state && state.done < state.total && currentWord && (
          <>
            <div className="mb-6 flex items-center justify-between text-xs text-gray-400">
              <span>今日复习</span>
              <span>
                {state.done + 1} / {state.total}
              </span>
            </div>

            {state.done < CHOICE_COUNT ? (
              <ReviewChoiceCard key={currentWord.id} word={currentWord} pool={words} onDone={markDone} onWrong={markWrong} />
            ) : (
              <ReviewTypeCard key={currentWord.id} word={currentWord} onDone={markDone} onWrong={markWrong} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
