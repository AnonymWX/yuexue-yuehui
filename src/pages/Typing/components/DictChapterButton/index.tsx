import Tooltip from '@/components/Tooltip'
import { currentChapterAtom, currentDictInfoAtom, isReviewModeAtom, wordDictationConfigAtom } from '@/store'
import range from '@/utils/range'
import { Listbox, Switch, Transition } from '@headlessui/react'
import { useAtom, useAtomValue } from 'jotai'
import { Fragment } from 'react'
import IconCheck from '~icons/tabler/check'

interface Props {
  onOpenDictPicker?: () => void
}

export const DictChapterButton = ({ onOpenDictPicker }: Props) => {
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const chapterCount = currentDictInfo.chapterCount
  const isReviewMode = useAtomValue(isReviewModeAtom)
  const [dictationConfig, setDictationConfig] = useAtom(wordDictationConfigAtom)

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
    }
  }

  const toggleDictation = () => {
    setDictationConfig((old) => ({ ...old, isOpen: !old.isOpen, openBy: 'user' }))
  }

  return (
    <>
      <Tooltip content="词典切换">
        <button
          type="button"
          onClick={onOpenDictPicker}
          className="rounded-lg px-3 py-1 text-lg font-bold text-indigo-600 transition-colors duration-200 hover:bg-indigo-50 focus:outline-none dark:text-indigo-400 dark:hover:bg-indigo-900/30"
        >
          {currentDictInfo.name} {isReviewMode && '错题复习'}
        </button>
      </Tooltip>

      {!isReviewMode && (
        <>
          <Tooltip content="章节切换">
            <Listbox value={currentChapter} onChange={setCurrentChapter}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button
                    onKeyDown={handleKeyDown}
                    className="flex items-center gap-1 rounded-lg px-3 py-1 text-lg text-gray-600 transition-colors duration-200 hover:bg-indigo-50 focus:outline-none dark:text-gray-300 dark:hover:bg-indigo-900/30"
                  >
                    第 {currentChapter + 1} 章<span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Listbox.Options className="absolute right-0 z-30 mt-2 max-h-72 w-40 overflow-y-auto rounded-2xl border-2 border-[#E8E2D4] bg-white py-1 shadow-xl focus:outline-none dark:border-gray-700 dark:bg-gray-800">
                      {range(0, chapterCount, 1).map((index) => (
                        <Listbox.Option key={index} value={index}>
                          {({ selected }) => (
                            <div
                              className={
                                'flex cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-2 text-sm transition ' +
                                (selected
                                  ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700')
                              }
                            >
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center">{selected && <IconCheck />}</span>
                              <span>第 {index + 1} 章</span>
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              )}
            </Listbox>
          </Tooltip>

          <Tooltip content="默写模式（Ctrl+V）">
            <div className="flex items-center gap-2 px-3 py-1">
              <Switch checked={dictationConfig.isOpen} onChange={toggleDictation} className="switch-root">
                <span aria-hidden="true" className="switch-thumb" />
              </Switch>
              <span className="text-sm text-gray-600 dark:text-gray-300">默写</span>
            </div>
          </Tooltip>
        </>
      )}
    </>
  )
}
