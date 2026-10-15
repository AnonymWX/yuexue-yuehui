#!/usr/bin/env node
// scripts/fix-course-ids.mjs
// 把课程文件里的 id 强制同步为「主题声明的 id」（内容不动）
// 用法：node scripts/fix-course-ids.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')
const LANG_DIR = { vi: 'vietnamese', en: 'english', ja: 'japanese', ko: 'korean' }

async function readJSON(p) {
  return JSON.parse(await readFile(p, 'utf8'))
}

const top = await readJSON(join(COURSES_DIR, 'index.json'))
let changed = 0

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
      let themeJson
      try {
        themeJson = await readJSON(join(stageDir, theme, 'index.json'))
      } catch {
        continue
      }
      for (const c of themeJson.courses || []) {
        const cp = join(stageDir, theme, c.file)
        const cd = await readJSON(cp)
        if (cd.id !== c.id) {
          console.log(`  ${stage.id}/${theme}/${c.file}  id: ${cd.id} → ${c.id}`)
          cd.id = c.id
          await writeFile(cp, JSON.stringify(cd, null, 4) + '\n', 'utf8')
          changed++
        }
      }
    }
  }
}
console.log(`\n共修正 ${changed} 处 course.id`)
