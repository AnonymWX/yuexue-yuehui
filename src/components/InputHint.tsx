// src/components/InputHint.tsx
// 通用输入法提示：跟随当前语言自动切换内容
import { currentLanguageAtom } from '@/store/language'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

// ============================================================
// 各语言配置
// ============================================================

interface ToneRule {
  key: string
  example: string
  desc: string
}

interface LetterRule {
  keys: string
  result: string
}

interface InputProfile {
  /** 面板标题 */
  title: string
  /** 顶部横条的短标题 */
  barTitle: string
  /** 声调 / 特殊键 */
  toneRules: ToneRule[]
  /** 字母变形 */
  letterRules: LetterRule[]
  /** 完整示例 */
  example: {
    input: string
    output: string
  }
}

const PROFILES: Record<string, InputProfile> = {
  // ---------- 越南语 Telex ----------
  vi: {
    title: 'Telex 越南语输入',
    barTitle: 'Telex 提示',
    toneRules: [
      { key: 's', example: 'as → á', desc: '锐声' },
      { key: 'f', example: 'af → à', desc: '玄声' },
      { key: 'r', example: 'ar → ả', desc: '问声' },
      { key: 'x', example: 'ax → ã', desc: '跌声' },
      { key: 'j', example: 'aj → ạ', desc: '重声' },
      { key: 'z', example: 'áz → a', desc: '取消声调' },
    ],
    letterRules: [
      { keys: 'aa / ee / oo', result: 'â / ê / ô' },
      { keys: 'uw / ow / aw', result: 'ư / ơ / ă' },
      { keys: 'dd', result: 'đ' },
    ],
    example: {
      input: 'tooi yeeu tieengs Vieetj',
      output: 'Tôi yêu tiếng Việt',
    },
  },

  // ---------- 日语 罗马字输入 ----------
  ja: {
    title: 'Romaji 日语输入',
    barTitle: '日语输入提示',
    toneRules: [
      { key: 'a i u e o', example: 'a → あ', desc: '基本元音' },
      { key: 'ka sa ta na', example: 'ka → か', desc: 'か行等' },
      { key: 'n', example: 'n → ん', desc: '拨音（孤立）' },
      { key: '-', example: 'a- → あー', desc: '长音' },
      { key: 'l / x', example: 'la → ぁ', desc: '小写假名' },
      { key: 'Enter', example: '→ 汉字候选', desc: '转换候选' },
    ],
    letterRules: [
      { keys: 'shi / chi / tsu', result: 'し / ち / つ' },
      { keys: 'sha / cha / ja', result: 'しゃ / ちゃ / じゃ' },
      { keys: 'kka / tta', result: 'っか / った（促音）' },
    ],
    example: {
      input: 'watashi wa gakusei desu',
      output: '私は学生です',
    },
  },

  // ---------- 韩语 2-beolsik 键盘 ----------
  ko: {
    title: '韩语 2-beolsik 输入',
    barTitle: '韩语输入提示',
    toneRules: [
      { key: 'q w e r t', example: 'q → ㅂ', desc: '辅音键（左）' },
      { key: 'y u i o p', example: 'y → ㅛ', desc: '元音键（右）' },
      { key: 'a s d f g', example: 'a → ㅁ', desc: '辅音键' },
      { key: 'h j k l', example: 'k → ㅏ', desc: '元音键' },
      { key: 'z x c v', example: 'z → ㅋ', desc: '辅音键' },
      { key: 'Shift', example: 'Shift + q → ㅃ', desc: '紧音' },
    ],
    letterRules: [
      { keys: '한 = gks', result: '한' },
      { keys: '글 = rmf', result: '글' },
      { keys: '감사 = rkatk', result: '감사' },
    ],
    example: {
      input: 'rkatk rkatk',
      output: '감사 감사',
    },
  },
}

// ============================================================

const STORAGE_PREFIX = 'input_hint_bar_dismissed_v1_'

interface Props {
  /** 是否在页面顶部显示横条 */
  showBar?: boolean
  /** 手动指定语言（默认跟随全局） */
  langOverride?: string
}

export default function InputHint({ showBar = true, langOverride }: Props) {
  const globalLang = useAtomValue(currentLanguageAtom)
  const lang = langOverride ?? globalLang
  const profile = PROFILES[lang]

  const [barVisible, setBarVisible] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  // 语言切换：重置横条状态 + 关面板
  useEffect(() => {
    setPanelOpen(false)
    if (!showBar || !profile) {
      setBarVisible(false)
      return
    }
    try {
      const dismissed = localStorage.getItem(STORAGE_PREFIX + lang)
      setBarVisible(!dismissed)
    } catch {
      setBarVisible(true)
    }
  }, [lang, showBar, profile])

  // 无该语言配置（如英语）→ 不渲染任何东西
  if (!profile) return null

  const dismissBar = () => {
    setBarVisible(false)
    try {
      localStorage.setItem(STORAGE_PREFIX + lang, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* ===== A. 顶部提示横条 ===== */}
      {showBar && barVisible && (
        <div className="sticky top-0 z-30 border-b border-indigo-100 bg-indigo-50/90 backdrop-blur dark:border-indigo-900/40 dark:bg-indigo-950/60">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2 text-xs">
            <span className="shrink-0 font-medium text-indigo-700 dark:text-indigo-300">{profile.barTitle}</span>

            <span className="hidden flex-1 flex-wrap gap-x-3 gap-y-1 text-gray-700 dark:text-gray-300 sm:flex">
              {profile.toneRules.slice(0, 5).map((r) => (
                <span key={r.key} className="whitespace-nowrap">
                  <code className="rounded bg-white px-1 py-0.5 font-mono dark:bg-gray-800">{r.key}</code>
                  <span className="ml-1 text-gray-500">{r.example.split(' → ')[1]}</span>
                </span>
              ))}
            </span>

            <span className="flex-1 text-gray-500 sm:hidden">点右下角 ? 查看规则</span>

            <button
              type="button"
              onClick={dismissBar}
              aria-label="关闭提示"
              className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/60 dark:hover:bg-gray-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ===== B. 右下角悬浮按钮 + 完整面板 ===== */}
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-label={`${profile.title} 帮助`}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-lg font-medium text-white shadow-lg transition hover:brightness-95"
      >
        {panelOpen ? '×' : '?'}
      </button>

      {panelOpen && (
        <div className="fixed bottom-20 right-6 z-40 h-[60vh] w-[340px] max-w-[90vw] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 text-lg font-semibold">{profile.title}</div>

          {/* 第一组：主规则 */}
          <div className="mb-5">
            <div className="mb-2.5 text-base font-medium text-gray-500">规则（{lang === 'vi' ? '声调' : '输入'}）</div>
            <ul className="space-y-2">
              {profile.toneRules.map((r) => (
                <li key={r.key} className="flex items-center justify-between text-base">
                  <span className="font-mono">
                    <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">{r.key}</span>
                    <span className="ml-2.5 text-gray-500">{r.example}</span>
                  </span>
                  <span className="text-gray-400">{r.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 第二组：字母 / 组合变形 */}
          <div>
            <div className="mb-2.5 text-base font-medium text-gray-500">组合</div>
            <ul className="space-y-2">
              {profile.letterRules.map((r) => (
                <li key={r.keys} className="flex items-center justify-between text-base">
                  <span className="font-mono">
                    <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">{r.keys}</span>
                    <span className="ml-2.5 text-gray-500">→ {r.result}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 完整示例 */}
          <div className="mt-5 border-t border-gray-100 pt-4 text-base text-gray-500 dark:border-gray-800">
            例：
            <code className="ml-1.5 font-mono">{profile.example.input}</code>
            <div className="mt-1.5">
              → <span className="font-medium text-gray-700 dark:text-gray-300">{profile.example.output}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
