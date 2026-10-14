import fs from 'fs'
import path from 'path'

const DICT_DIR = 'public/dicts'
const COURSE_DIR = 'public/courses/vietnamese'

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

function getAllCourseFiles() {
  if (!fs.existsSync(COURSE_DIR)) return []
  return fs
    .readdirSync(COURSE_DIR)
    .filter((f) => f.endsWith('.json') && f.startsWith('course_'))
    .map((f) => path.join(COURSE_DIR, f))
}

function getDictFiles() {
  if (!fs.existsSync(DICT_DIR)) return []
  return fs
    .readdirSync(DICT_DIR)
    .filter((f) => f.startsWith('vietnamese_') && f.endsWith('.json'))
    .map((f) => path.join(DICT_DIR, f))
}

function syncCourses() {
  const courseFiles = getAllCourseFiles()
  if (courseFiles.length === 0) return { added: 0, existing: 0 }

  // 1. 收集所有课程里的单词
  const courseWords = []
  for (const file of courseFiles) {
    try {
      const course = readJson(file)
      if (Array.isArray(course.words)) {
        for (const w of course.words) {
          if (typeof w === 'object' && w.id) courseWords.push(w)
        }
      }
    } catch (e) {
      console.warn(`[course-sync] 读取失败: ${file}`, e.message)
    }
  }

  // 2. 收集词典已有 id
  const dictFiles = getDictFiles()
  const existingIds = new Set()
  const dictData = new Map()
  for (const file of dictFiles) {
    try {
      const data = readJson(file)
      dictData.set(file, data)
      for (const w of data) if (w.id) existingIds.add(w.id)
    } catch (e) {
      console.warn(`[course-sync] 词典读取失败: ${file}`, e.message)
    }
  }

  // 3. 找出缺失
  const missing = []
  let existing = 0
  for (const w of courseWords) {
    if (existingIds.has(w.id)) {
      existing++
    } else {
      missing.push(w)
    }
  }

  if (missing.length === 0) {
    return { added: 0, existing }
  }

  // 4. 按等级分组
  const grouped = {}
  for (const w of missing) {
    const tags = w.tags || []
    const levelTag = tags.find((t) => /^[ABC][12]$/.test(t)) || 'A1'
    const fileName = `vietnamese_${levelTag.toLowerCase()}.json`
    if (!grouped[fileName]) grouped[fileName] = []
    grouped[fileName].push(w)
  }

  // 5. 追加并去重
  for (const [fileName, words] of Object.entries(grouped)) {
    const full = path.join(DICT_DIR, fileName)
    let data
    if (fs.existsSync(full)) {
      data = readJson(full)
    } else {
      data = []
    }
    const ids = new Set(data.map((w) => w.id))
    for (const w of words) {
      if (!ids.has(w.id)) {
        data.push(w)
        ids.add(w.id)
      }
    }
    writeJson(full, data)
    console.log(`[course-sync] ${fileName}: 追加 ${words.length} 条`)
  }

  return { added: missing.length, existing }
}

export default function courseSyncPlugin() {
  let synced = false

  return {
    name: 'course-sync',
    apply: 'serve',

    configureServer(server) {
      const run = () => {
        try {
          const result = syncCourses()
          if (result.added > 0) {
            console.log(`[course-sync] 已追加 ${result.added} 条新词`)
          }
        } catch (e) {
          console.error('[course-sync] 同步失败:', e)
        }
      }

      // 启动时执行一次
      run()

      // 监听课程目录变化
      const watchDir = path.resolve(COURSE_DIR)
      if (fs.existsSync(watchDir)) {
        server.watcher.add(watchDir)
        server.watcher.on('change', (file) => {
          if (file.includes('courses') && file.endsWith('.json')) {
            run()
          }
        })
        server.watcher.on('add', (file) => {
          if (file.includes('courses') && file.endsWith('.json')) {
            run()
          }
        })
      }
    },

    // 构建前也同步一次
    buildStart() {
      if (!synced) {
        try {
          syncCourses()
        } catch (e) {
          console.error('[course-sync] 构建同步失败:', e)
        }
        synced = true
      }
    },
  }
}
