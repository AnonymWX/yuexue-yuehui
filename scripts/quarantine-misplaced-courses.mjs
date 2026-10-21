#!/usr/bin/env node
// scripts/quarantine-misplaced-courses.mjs
// 从主题 index.json 移除「scenario 与目录名不符」的课程条目（文件保留在磁盘，不再被路由）
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

function detectIndent(text) {
  const m = text.match(/\n( +)"/)
  return m ? m[1] : '  '
}

async function main() {
  const topIndex = JSON.parse(await readFile(join(COURSES_DIR, 'index.json'), 'utf8'))
  const hits = []

  for (const [lang, cfg] of Object.entries(topIndex)) {
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
        let idx, raw
        try {
          raw = await readFile(idxPath, 'utf8')
          idx = JSON.parse(raw)
        } catch {
          continue
        }
        for (const co of idx.courses || []) {
          let cd
          try {
            cd = JSON.parse(await readFile(join(stageDir, theme, co.file), 'utf8'))
          } catch {
            continue
          }
          if (cd.scenario && cd.scenario !== theme) {
            hits.push({ idxPath, raw, idx, theme, stage: stage.id, lang, course: co, actualScenario: cd.scenario })
          }
        }
      }
    }
  }

  if (!hits.length) {
    console.log(c.green('✅ 没有 scenario 与目录不符的课程'))
    return
  }

  console.log(c.yellow(`\n发现 ${hits.length} 处 scenario 不符：\n`))
  for (const h of hits) {
    console.log(`  ${h.course.id}  (${h.lang}/${h.stage}/${h.theme})`)
    console.log(c.gray(`    title="${h.course.title}" scenario="${h.actualScenario}"`))
    console.log(c.gray(`    ${rel(h.idxPath)}`))
  }

  if (!APPLY) {
    console.log(c.gray('\n预览模式。加 --apply 从 index.json 移除这些条目（文件保留在磁盘，不再被路由）'))
    console.log(c.gray('代价：这 3 课在 UI 消失，相关句子可能变孤儿（check 会 warning）。内容补齐建议作为 P1。'))
    return
  }

  const byIdx = new Map()
  for (const h of hits) {
    if (!byIdx.has(h.idxPath)) byIdx.set(h.idxPath, { raw: h.raw, idx: h.idx, remove: new Set() })
    byIdx.get(h.idxPath).remove.add(h.course.id)
  }
  for (const [idxPath, info] of byIdx) {
    const indent = detectIndent(info.raw)
    info.idx.courses = info.idx.courses.filter((co) => !info.remove.has(co.id))
    await writeFile(idxPath, JSON.stringify(info.idx, null, indent) + '\n', 'utf8')
  }
  console.log(c.green(`\n✅ 已更新 ${byIdx.size} 个 index.json，移除 ${hits.length} 条课程声明`))
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
