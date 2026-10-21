#!/usr/bin/env node
// scripts/fix-telex-in-non-vi.mjs
// 把非越南语课程里的 telex_input 练习改为 fill（结构兼容，只改 type 字段）
// 默认预览，--apply 落盘
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')
const APPLY = process.argv.includes('--apply')
const LANG_DIR = { vi: 'vietnamese', en: 'english', ja: 'japanese', ko: 'korean' }
const c = { green: (s) => `\x1b[32m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`, gray: (s) => `\x1b[90m${s}\x1b[0m` }
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

async function readJSON(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const topIndex = await readJSON(join(COURSES_DIR, 'index.json'))
  const targets = []

  for (const [lang, cfg] of Object.entries(topIndex || {})) {
    if (lang === 'vi') continue
    for (const stage of cfg.stages || []) {
      const stageDir = join(COURSES_DIR, LANG_DIR[lang] ?? lang, stage.id)
      let themes
      try {
        themes = (await readdir(stageDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
      } catch {
        continue
      }
      for (const theme of themes) {
        const ti = await readJSON(join(stageDir, theme, 'index.json'))
        for (const co of ti?.courses || []) {
          const p = join(stageDir, theme, co.file)
          const data = await readJSON(p)
          if (!data) continue
          const hits = (data.exercises || []).map((ex, i) => (ex?.type === 'telex_input' ? i : -1)).filter((i) => i >= 0)
          if (hits.length) targets.push({ path: p, data, hits, lang })
        }
      }
    }
  }

  if (!targets.length) {
    console.log(c.green('✅ 非越南语课程里没有 telex_input'))
    return
  }

  console.log(c.yellow(`发现 ${targets.length} 个文件含 telex_input（共 ${targets.reduce((n, t) => n + t.hits.length, 0)} 处）\n`))
  for (const t of targets) {
    console.log(`  ${rel(t.path)}  [${t.lang}]  index=${t.hits.join(',')}`)
    for (const i of t.hits) console.log(c.gray(`    → ${JSON.stringify(t.data.exercises[i]).slice(0, 100)}`))
  }

  if (!APPLY) {
    console.log(c.gray('\n预览模式。加 --apply 落盘（type: telex_input → fill）'))
    return
  }

  let changed = 0
  for (const t of targets) {
    const content = await readFile(t.path, 'utf8')
    const next = content.replace(/"type"\s*:\s*"telex_input"/g, '"type": "fill"')
    if (next !== content) {
      await writeFile(t.path, next, 'utf8')
      changed++
    }
  }
  console.log(c.green(`\n✅ 已改写 ${changed} 个文件（字符串级替换，保留原格式）`))
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
