const STORAGE_KEY = 'chapter_per_dict_v1'

type ChapterMap = Record<string, number>

function readAll(): ChapterMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ChapterMap
  } catch {
    return {}
  }
}

function writeAll(m: ChapterMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

export function getSavedChapter(dictId: string): number | null {
  const v = readAll()[dictId]
  return typeof v === 'number' && v >= 0 ? v : null
}

export function saveChapter(dictId: string, chapter: number): void {
  if (!dictId) return
  const m = readAll()
  m[dictId] = chapter
  writeAll(m)
}

export function clearChapter(dictId: string): void {
  const m = readAll()
  delete m[dictId]
  writeAll(m)
}