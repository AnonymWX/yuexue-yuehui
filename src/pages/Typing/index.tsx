import { DictChapterButton } from './components/DictChapterButton'
import DictPicker from './components/DictPicker'
import ResultScreen from './components/ResultScreen'
import Speed from './components/Speed'
import WordList from './components/WordList'
import WordPanel from './components/WordPanel'
import { useConfetti } from './hooks/useConfetti'
import { useWordList } from './hooks/useWordList'
import { TypingContext, TypingStateActionType, initialState, typingReducer } from './store'
import { DonateCard } from '@/components/DonateCard'
import DrillEntry from '@/components/DrillEntry'
import { idDictionaryMap, dictionaries } from '@/resources/dictionary'
import { getLanguageMeta } from '@/resources/languages'
import { currentChapterAtom, currentDictIdAtom, isReviewModeAtom, randomConfigAtom, reviewModeInfoAtom } from '@/store'
import { getSavedChapter, saveChapter } from '@/store/chapterPerDict'
// ★
import { getSavedDict, saveDict } from '@/store/dictPerLang'
import { currentLanguageAtom } from '@/store/language'
import { IsDesktop, isLegal } from '@/utils'
import { useSaveChapterRecord } from '@/utils/db'
import { useMixPanelChapterLogUploader } from '@/utils/mixpanel'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useImmerReducer } from 'use-immer'

const App: React.FC = () => {
  const [state, dispatch] = useImmerReducer(typingReducer, structuredClone(initialState))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { words } = useWordList()

  const [currentDictId, setCurrentDictId] = useAtom(currentDictIdAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom) // ★ 改成可读可写
  const randomConfig = useAtomValue(randomConfigAtom)
  const chapterLogUploader = useMixPanelChapterLogUploader(state)
  const saveChapterRecord = useSaveChapterRecord()

  const reviewModeInfo = useAtomValue(reviewModeInfoAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)

  // ===== 语言联动 =====
  const currentLang = useAtomValue(currentLanguageAtom)
  const langMeta = getLanguageMeta(currentLang)
  const dictsInLang = useMemo(() => dictionaries.filter((d) => d.languageCategory === currentLang), [currentLang])
  const [showDictPicker, setShowDictPicker] = useState(false)

  // 切换语言（或首次进入）时，决定用哪本词典
  useEffect(() => {
    const savedId = getSavedDict(currentLang)
    const savedValid = savedId && dictsInLang.some((d) => d.id === savedId)
    const currentValid = dictsInLang.some((d) => d.id === currentDictId)

    if (currentValid) {
      saveDict(currentLang, currentDictId)
      setShowDictPicker(false)
      return
    }

    if (savedValid) {
      setCurrentDictId(savedId!)
      // ★ 恢复该词典上次学的章节
      const savedChapter = getSavedChapter(savedId!) ?? 0
      setCurrentChapter(savedChapter)
      setShowDictPicker(false)
      return
    }

    setShowDictPicker(true)
  }, [currentLang, dictsInLang, currentDictId, setCurrentDictId, setCurrentChapter])

  // ★ 章节变化时持久化（节流 300ms，避免快速翻章时写太频繁）
  useEffect(() => {
    if (!currentDictId) return
    const t = setTimeout(() => {
      saveChapter(currentDictId, currentChapter)
    }, 300)
    return () => clearTimeout(t)
  }, [currentDictId, currentChapter])

  const handlePickDict = useCallback(
    (id: string) => {
      setCurrentDictId(id)
      // ★ 用该词典上次的章节；没记录就从 0 开始
      const savedChapter = getSavedChapter(id) ?? 0
      setCurrentChapter(savedChapter)
      saveDict(currentLang, id)
      setShowDictPicker(false)
    },
    [setCurrentDictId, setCurrentChapter, currentLang],
  )

  // ===== 以下原有逻辑 =====
  useEffect(() => {
    if (!IsDesktop()) {
      setTimeout(() => {
        alert(
          ' Qwerty Learner 目的为提高键盘工作者的英语输入效率，目前暂未适配移动端，希望您使用桌面端浏览器访问。如您使用的是 Ipad 等平板电脑设备，可以使用外接键盘使用本软件。',
        )
      }, 500)
    }
  }, [])

  useEffect(() => {
    const id = currentDictId
    if (!(id in idDictionaryMap)) {
      return
    }
  }, [currentDictId])

  const skipWord = useCallback(() => {
    dispatch({ type: TypingStateActionType.SKIP_WORD })
  }, [dispatch])

  useEffect(() => {
    const onBlur = () => {
      dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
    }
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('blur', onBlur)
    }
  }, [dispatch])

  useEffect(() => {
    state.chapterData.words?.length > 0 ? setIsLoading(false) : setIsLoading(true)
  }, [state.chapterData.words])

  useEffect(() => {
    if (!state.isTyping) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (!isLoading && e.key !== 'Enter' && (isLegal(e.key) || e.key === ' ') && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: true })
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [state.isTyping, isLoading, dispatch])

  useEffect(() => {
    if (words !== undefined) {
      const initialIndex = isReviewMode && reviewModeInfo.reviewRecord?.index ? reviewModeInfo.reviewRecord.index : 0
      dispatch({
        type: TypingStateActionType.SETUP_CHAPTER,
        payload: { words, shouldShuffle: randomConfig.isOpen, initialIndex },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words])

  useEffect(() => {
    if (state.isFinished && !state.isSavingRecord) {
      chapterLogUploader()
      saveChapterRecord(state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isFinished, state.isSavingRecord])

  useEffect(() => {
    let intervalId: number
    if (state.isTyping) {
      intervalId = window.setInterval(() => {
        dispatch({ type: TypingStateActionType.TICK_TIMER })
      }, 1000)
    }
    return () => clearInterval(intervalId)
  }, [state.isTyping, dispatch])

  useConfetti(state.isFinished)

  return (
    <TypingContext.Provider value={{ state: state, dispatch }}>
      {state.isFinished && <DonateCard />}
      {state.isFinished && <ResultScreen />}

      <div className="flex min-h-screen flex-col">
        <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-10">
          <DictChapterButton onOpenDictPicker={() => setShowDictPicker(true)} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center pb-5">
          <div className="relative flex w-full flex-col items-center">
            <div className="flex w-full flex-grow items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center ">
                  <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid  border-indigo-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  ></div>
                </div>
              ) : (
                !state.isFinished && <WordPanel />
              )}
            </div>
            <Speed />
          </div>
        </div>
      </div>

      <WordList />
      <DrillEntry />

      <DictPicker open={showDictPicker} dicts={dictsInLang} langLabel={langMeta.label} onSelect={handlePickDict} />
    </TypingContext.Provider>
  )
}

export default App
