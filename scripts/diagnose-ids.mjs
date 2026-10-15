#!/usr/bin/env node
// scripts/diagnose-ids.mjs
// 诊断 course.id 不一致 & word.id 冲突，只读不改
// 用法：node scripts/diagnose-ids.mjs
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')
const LANG_DIR = { vi: 'vietnamese', en: 'english', ja: 'japanese', ko: 'korean' }
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

async function readJSON(p) {
  return JSON.parse(await readFile(p, 'utf8'))
}

async function main() {
  const top = await readJSON(join(COURSES_DIR, 'index.json'))

  const courseMismatches = []
  const wordIdMap = new Map() // id -> [{path, courseId, name, trans}]

  for (const [lang, cfg] of Object.entries(top)) {
    if (!cfg.stages) continue
    const dirName = LANG_DIR[lang] ?? lang

    for (const stage of cfg.stages) {
      const stageDir = join(COURSES_DIR, dirName, stage.id)
      let themes
      try {
        themes = (await readdir(stageDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
      } catch {
        continue
      }

      for (const theme of themes) {
        const themePath = join(stageDir, theme, 'index.json')
        let themeJson
        try {
          themeJson = await readJSON(themePath)
        } catch {
          continue
        }

        for (const c of themeJson.courses || []) {
          const coursePath = join(stageDir, theme, c.file)
          let courseJson
          try {
            courseJson = await readJSON(coursePath)
          } catch {
            continue
          }

          if (courseJson.id !== c.id) {
            courseMismatches.push({
              themeDeclared: c.id,
              fileActual: courseJson.id,
              fileTitle: courseJson.title,
              themeTitle: c.title,
              path: rel(coursePath),
            })
          }

          for (const w of courseJson.words || []) {
            if (!w.id) continue
            if (!wordIdMap.has(w.id)) wordIdMap.set(w.id, [])
            wordIdMap.get(w.id).push({
              path: rel(coursePath),
              courseId: courseJson.id,
              name: w.name,
              trans: (w.trans || []).join('/'),
            })
          }
        }
      }
    }
  }

  // ===== course.id 不一致 =====
  console.log('\n========================================')
  console.log('  course.id 不一致（' + courseMismatches.length + ' 处）')
  console.log('========================================')
  for (const m of courseMismatches) {
    console.log(`\n  ${m.path}`)
    console.log(`    主题声明 id : ${m.themeDeclared}  (title: ${m.themeTitle})`)
    console.log(`    文件实际 id : ${m.fileActual}    (title: ${m.fileTitle})`)
  }

  // ===== word.id 冲突 =====
  const sameName = []
  const diffName = []
  for (const [id, entries] of wordIdMap) {
    if (entries.length < 2) continue
    const names = new Set(entries.map((e) => e.name))
    if (names.size === 1) sameName.push({ id, entries })
    else diffName.push({ id, entries })
  }

  console.log('\n\n========================================')
  console.log('  word.id 冲突 — 同名（' + sameName.length + ' 组，可不动）')
  console.log('========================================')
  for (const { id, entries } of sameName) {
    console.log(`  ${id}  →  "${entries[0].name}"  ×${entries.length}`)
    for (const e of entries) console.log(`      ${e.path}`)
  }

  console.log('\n\n========================================')
  console.log('  word.id 冲突 — 不同名（' + diffName.length + ' 组，必须修）')
  console.log('========================================')
  for (const { id, entries } of diffName) {
    console.log(`\n  ${id}:`)
    for (const e of entries) {
      console.log(`    "${e.name}"  [${e.trans}]`)
      console.log(`      ${e.path}`)
    }
  }

  console.log('\n\n========================================')
  console.log('  汇总')
  console.log('========================================')
  console.log(`  course.id 不一致 : ${courseMismatches.length}`)
  console.log(`  word.id 同名冲突 : ${sameName.length} 组`)
  console.log(`  word.id 不同名冲突 : ${diffName.length} 组`)
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
