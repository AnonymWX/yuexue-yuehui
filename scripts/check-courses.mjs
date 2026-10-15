#!/usr/bin/env node
// scripts/check-courses.mjs
// 课程数据一致性检查：ID 去重 / 字段完整 / 目录规范
// 用法：node scripts/check-courses.mjs
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
}

const problems = []
const warnings = []
const addProblem = (type, msg, detail) => problems.push({ type, msg, detail })
const addWarning = (type, msg, detail) => warnings.push({ type, msg, detail })

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

async function readJSON(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    addProblem('JSON 解析失败', rel(path), e.message)
    return null
  }
}

async function main() {
  const topIndex = await readJSON(join(COURSES_DIR, 'index.json'))
  if (!topIndex) return report()

  const stats = { themes: 0, courses: 0, words: 0 }
  const seenCourseIds = new Map()
  const seenWordIds = new Map()

  // 语言 key → 目录名映射（与 useCourse.ts 的 LANG_DIR 保持一致）
  const LANG_DIR = {
    vi: 'vietnamese',
    en: 'english',
    ja: 'japanese',
    ko: 'korean',
  }

  for (const [lang, cfg] of Object.entries(topIndex)) {
    if (!cfg.stages) continue
    const dirName = LANG_DIR[lang] ?? lang
    const langDir = join(COURSES_DIR, dirName)

    for (const stage of cfg.stages) {
      const stageDir = join(langDir, stage.id)
      let actualThemes
      try {
        actualThemes = (await readdir(stageDir, { withFileTypes: true }))
          .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
          .map((d) => d.name)
      } catch {
        addProblem('目录缺失', `${dirName}/${stage.id} 目录不存在`, rel(stageDir))
        continue
      }

      const declared = new Set(stage.themes || [])
      const actual = new Set(actualThemes)
      for (const t of declared) {
        if (!actual.has(t)) addProblem('主题缺失', `index.json 声明了 "${t}"，但目录不存在`, rel(stageDir))
      }
      for (const t of actual) {
        if (!declared.has(t)) addProblem('主题未声明', `目录 "${t}" 存在，但 index.json 的 themes 里没有`, rel(stageDir))
      }

      for (const theme of actualThemes) {
        if (theme !== theme.toLowerCase() || /\s/.test(theme)) {
          addProblem('命名不规范', `主题目录应为全小写、无空格："${theme}"`, rel(join(stageDir, theme)))
        }

        const themeIndexPath = join(stageDir, theme, 'index.json')
        const themeIndex = await readJSON(themeIndexPath)
        if (!themeIndex) continue

        if (themeIndex.stage !== stage.id) {
          addProblem('stage 不匹配', `目录是 "${stage.id}"，但 index.json 里 stage="${themeIndex.stage}"`, rel(themeIndexPath))
        }

        if (!Array.isArray(themeIndex.courses)) {
          addProblem('结构错误', `缺少 courses 数组`, rel(themeIndexPath))
          continue
        }

        stats.themes++

        for (const course of themeIndex.courses) {
          stats.courses++

          if (!course.id) {
            addProblem('缺少字段', `course 缺 id`, rel(themeIndexPath))
            continue
          }
          if (course.id !== course.id.toLowerCase()) {
            addProblem('命名不规范', `course.id 应为全小写："${course.id}"`, rel(themeIndexPath))
          }

          if (seenCourseIds.has(course.id)) {
            addProblem('重复 course.id', `"${course.id}"`, `\n      A: ${seenCourseIds.get(course.id)}\n      B: ${rel(themeIndexPath)}`)
          } else {
            seenCourseIds.set(course.id, rel(themeIndexPath))
          }

          if (!course.file) {
            addProblem('缺少字段', `course "${course.id}" 缺 file`, rel(themeIndexPath))
            continue
          }

          const coursePath = join(stageDir, theme, course.file)
          try {
            await stat(coursePath)
          } catch {
            addProblem('文件缺失', `course "${course.id}" 的 file="${course.file}" 不存在`, rel(join(stageDir, theme)))
            continue
          }
          const courseData = await readJSON(coursePath)
          if (!courseData) continue

          if (courseData.id !== course.id) {
            addProblem('id 不一致', `主题声明 "${course.id}"，文件里是 "${courseData.id}"`, rel(coursePath))
          }

          if (!Array.isArray(courseData.words)) {
            addProblem('结构错误', `缺少 words 数组`, rel(coursePath))
            continue
          }
          for (const w of courseData.words) {
            stats.words++
            if (!w.id) {
              addProblem('词条缺 id', `某词条无 id`, rel(coursePath))
              continue
            }
            if (!w.name) {
              addProblem('词条缺 name', `"${w.id}" 无 name`, rel(coursePath))
              continue
            }
            if (!Array.isArray(w.trans) || w.trans.length === 0) {
              addProblem('词条缺 trans', `"${w.id}" (${w.name}) 的 trans 为空`, rel(coursePath))
            }
            if (seenWordIds.has(w.id)) {
              const prev = seenWordIds.get(w.id)
              addProblem(
                '重复 word.id',
                `"${w.id}"`,
                `\n      A: ${prev.file}  (name="${prev.name}")\n      B: ${rel(coursePath)}  (name="${w.name}")`,
              )
            } else {
              seenWordIds.set(w.id, { file: rel(coursePath), name: w.name })
            }
          }
        }
      }
    }
  }

  report(stats)
}

function report(stats) {
  const line = c.gray('─'.repeat(64))
  console.log(line)
  if (stats) {
    console.log(`扫描：${stats.themes} 个主题 / ${stats.courses} 节课 / ${stats.words} 个词条`)
  }
  console.log(line)

  if (warnings.length > 0) {
    console.log(c.yellow(`\n⚠️  warning 共 ${warnings.length} 处（不阻断，仅提示）`))
    for (const w of warnings) {
      console.log(`  [${w.type}] ${w.msg}`)
      if (w.detail) console.log(c.gray(`    ${w.detail}`))
    }
  }

  if (problems.length === 0) {
    console.log(c.green('\n✅ 未发现错误'))
    process.exit(0)
  }

  const byType = {}
  for (const p of problems) (byType[p.type] ||= []).push(p)

  for (const [type, items] of Object.entries(byType)) {
    console.log(c.red(`\n❌ [${type}] 共 ${items.length} 处`))
    for (const p of items.slice(0, 30)) {
      console.log(`  ${p.msg}`)
      if (p.detail) console.log(c.gray(`  ${p.detail}`))
    }
    if (items.length > 30) console.log(c.gray(`  ... 还有 ${items.length - 30} 处未显示`))
  }

  console.log('')
  console.log(c.red(`总计 ${problems.length} 处错误`))
  process.exit(1)
}

main().catch((e) => {
  console.error(c.red('脚本异常：'), e)
  process.exit(2)
})
