/**
 * 记录「每个语言下用户最后选的词典」
 * 切换语言时用它恢复；没有记录则弹窗让用户选
 */

const STORAGE_KEY = 'dict_per_lang_v1'

type DictMap = Record<string, string>

function readAll(): DictMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as DictMap
  } catch {
    return {}
  }
}

function writeAll(m: DictMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

export function getSavedDict(lang: string): string | null {
  return readAll()[lang] ?? null
}

export function saveDict(lang: string, dictId: string): void {
  const m = readAll()
  m[lang] = dictId
  writeAll(m)
}

export function clearDictForLang(lang: string): void {
  const m = readAll()
  delete m[lang]
  writeAll(m)
}
