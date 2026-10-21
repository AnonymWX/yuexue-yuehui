#!/usr/bin/env node
// scripts/fix-theme-order.mjs
// 按主题内 courses[] 顺序重排 title 的「第 N 课」序号 + order 字段
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

function detectIndent(t) {
  const m = t.match(/\n( +)"/)
  return m ? m[1] : '  '
}
const retitle = (title, n) => title.replace(/第\s*\d+\s*([课課])/, `第 ${n} $1`)

async function readJSON(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const topIndex = await readJSON(join(COURSES_DIR, 'index.json'))
  const plans = []

  for (const [lang, cfg] of Object.entries(topIndex || {})) {
    for (const stage of cfg.stages || []) {
      const stageDir = join(COURSES_DIR, LANG_DIR[lang] ?? lang, stage.id)
      let themes
      try {
        themes = (await readdir(stageDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
      } catch {
        continue
      }
      for (const theme of themes) {
        const idxPath = join(stageDir, theme, 'index.json')
        const raw = await readFile(idxPath, 'utf8')
        const idx = JSON.parse(raw)
        let touched = false
        const changes = []
        for (let i = 0; i < (idx.courses || []).length; i++) {
          const co = idx.courses[i]
          const n = i + 1
          const fp = join(stageDir, theme, co.file)
          const cd = await readJSON(fp)
          if (!cd) continue
          const newIdxTitle = co.title ? retitle(co.title, n) : co.title
          const newFileTitle = cd.title ? retitle(cd.title, n) : cd.title
          const needIdx = newIdxTitle !== co.title
          const needFile = newFileTitle !== cd.title || cd.order !== n
          if (needIdx || needFile) {
            touched = true
            changes.push({ co, cd, fp, n, newIdxTitle, newFileTitle })
          }
        }
        if (touched) plans.push({ idxPath, raw, idx, changes })
      }
    }
  }

  if (!plans.length) {
    console.log(c.green('✅ 所有主题的 title 序号和 order 都已连续'))
    return
  }

  const total = plans.reduce((s, p) => s + p.changes.length, 0)
  console.log(c.yellow(`\n发现 ${total} 课需要重排（${plans.length} 个主题）\n`))
  for (const p of plans) {
    console.log(`  ${rel(p.idxPath)}`)
    for (const ch of p.changes) {
      console.log(c.gray(`    ${ch.co.id}  order ${ch.cd.order}→${ch.n}  title "${ch.cd.title}" → "${ch.newFileTitle}"`))
    }
  }

  if (!APPLY) {
    console.log(c.gray('\n预览模式。加 --apply 落盘（只改 title 序号和 order，course.id 不动）'))
    return
  }

  for (const p of plans) {
    const indent = detectIndent(p.raw)
    for (const ch of p.changes) {
      ch.co.title = ch.newIdxTitle
      ch.cd.title = ch.newFileTitle
      ch.cd.order = ch.n
      await writeFile(ch.fp, JSON.stringify(ch.cd, null, indent) + '\n', 'utf8')
    }
    await writeFile(p.idxPath, JSON.stringify(p.idx, null, indent) + '\n', 'utf8')
  }
  console.log(c.green(`\n✅ 已重排 ${total} 课`))
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
