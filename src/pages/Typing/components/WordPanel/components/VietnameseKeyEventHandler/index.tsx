import type { WordUpdateAction } from '../InputHandler'
import { EXPLICIT_SPACE } from '@/constants'
import { createTelexEngine } from '@/engines/telex'
import type { TelexEngine } from '@/engines/telex'
import { TypingContext } from '@/pages/Typing/store'
import { useCallback, useContext, useEffect, useRef } from 'react'

export default function VietnameseKeyEventHandler({
  updateInput,
  wordName,
  viResetSignal,
}: {
  updateInput: (updateObj: WordUpdateAction) => void
  wordName: string
  viResetSignal?: number
}) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!
  const engineRef = useRef<TelexEngine | null>(null)

  useEffect(() => {
    if (!wordName) {
      engineRef.current = null
      return
    }
    engineRef.current = createTelexEngine(wordName)
  }, [wordName])

  useEffect(() => {
    engineRef.current?.reset()
  }, [viResetSignal])

  const toDisplay = useCallback((s: string) => s.replace(/ /g, EXPLICIT_SPACE), [])

  const onKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (!state.isTyping) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.isComposing || e.keyCode === 229) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        const result = engineRef.current?.backspace()
        if (!result) return
        updateInput({
          type: 'vi-update',
          display: toDisplay(result.display),
          completedChars: result.completedChars,
          isFinished: false,
          failedAtChar: null,
        })
        return
      }

      if (e.key.length !== 1) return

      e.preventDefault()
      const result = engineRef.current?.feed(e.key)
      if (!result) return

      if (result.status === 'reject') {
        updateInput({
          type: 'vi-update',
          display: toDisplay(result.display),
          completedChars: 0,
          isFinished: false,
          failedAtChar: result.failedAtChar,
        })
        return
      }

      if (result.status === 'accept') {
        updateInput({
          type: 'vi-update',
          display: toDisplay(result.display),
          completedChars: result.display.length,
          isFinished: true,
          failedAtChar: null,
        })
        return
      }

      // result.status === 'pending'
      updateInput({
        type: 'vi-update',
        display: toDisplay(result.display),
        completedChars: result.completedChars,
        isFinished: false,
        failedAtChar: null,
      })
    },
    [state.isTyping, updateInput, toDisplay],
  )

  useEffect(() => {
    if (!state.isTyping) return
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [onKeydown, state.isTyping])

  return null
}
