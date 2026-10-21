#!/usr/bin/env node
// scripts/fix-cross-stage-words.mjs
// P0-2：跨阶段 word.id 治理
//   默认：预览
//   --apply：仅落盘「无冲突」的自动修复（越南语 a1 的 vi_a2_X → vi_X）
// 冲突（同 id 也出现在正确阶段 / 目标 id 已存在）只报告，不动手。
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')
const SENTENCES_DIR = join(ROOT, 'src', 'sentences')

const APPLY = process.argv.includes('--apply')
const LANG_DIR = { vi: 'vietnamese', en: 'english', ja: 'japanese', ko: 'korean' }

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
}
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')

function expectedWordPattern(lang, stageId) {
  if (lang === 'vi') {
    if (stageId === 'a1') return /^vi_(?!a\d+_|b\d+_)/
    if (/^[ab]\d$/.test(stageId)) return new RegExp(`^vi_${stageId}_`)
  }
  if ((lang === 'ja' || lang === 'ko') && /^[ab]\d$/.test(stageId)) {
    return new RegExp(`^${lang}_${stageId}_`)
  }
  return null
}

async function readJSON(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const topIndex = await readJSON(join(COURSES_DIR, 'index.json'))
  if (!topIndex) {
    console.error(c.red('读取 src/courses/index.json 失败'))
    process.exit(2)
  }

  // 1. 收集所有课程文件
  const courses = []
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
        const ti = await readJSON(join(stageDir, theme, 'index.json'))
        for (const co of ti?.courses || []) {
          const p = join(stageDir, theme, co.file)
          const data = await readJSON(p)
          if (data) courses.push({ path: p, lang, stage: stage.id, theme, data })
        }
      }
    }
  }

  // 2. word.id 使用统计
  const usage = new Map() // id -> [{ coursePath, lang, stage, name }]
  for (const co of courses) {
    for (const w of co.data.words || []) {
      if (!w.id) continue
      const arr = usage.get(w.id) || []
      arr.push({ coursePath: co.path, lang: co.lang, stage: co.stage, name: w.name })
      usage.set(w.id, arr)
    }
  }

  // 3. 分类
  const plans = []
  for (const [wordId, usages] of usage) {
    const bad = usages.filter((u) => {
      const pat = expectedWordPattern(u.lang, u.stage)
      return pat && !pat.test(wordId)
    })
    if (bad.length === 0) continue

    const good = usages.filter((u) => {
      const pat = expectedWordPattern(u.lang, u.stage)
      return !pat || pat.test(wordId)
    })

    // 只对「越南语 a1 里的 vi_a2_X」做自动推导
    let newId = null
    const first = bad[0]
    if (first.lang === 'vi' && first.stage === 'a1' && wordId.startsWith('vi_a2_')) {
      newId = 'vi_' + wordId.slice('vi_a2_'.length)
    }
    const targetTaken = newId && usage.has(newId)
    plans.push({
      wordId,
      newId,
      bad,
      good,
      conflict: good.length > 0 || targetTaken,
      conflictReason: good.length > 0 ? '同 id 也出现在正确阶段' : targetTaken ? '目标 id 已被占用' : null,
    })
  }

  if (plans.length === 0) {
    console.log(c.green('✅ 未发现跨阶段 word.id 问题'))
    return
  }

  const autoFixable = plans.filter((p) => p.newId && !p.conflict)
  const conflicted = plans.filter((p) => p.conflict)
  const manual = plans.filter((p) => !p.newId)

  console.log(c.yellow(`\n发现 ${plans.length} 个跨阶段 word.id 问题\n`))

  if (autoFixable.length) {
    console.log(c.green(`▶ 可自动修复 ${autoFixable.length} 个：`))
    for (const p of autoFixable) {
      const stages = [...new Set(p.bad.map((u) => `${u.lang}/${u.stage}`))].join(',')
      console.log(`  ${c.cyan(p.wordId)} → ${c.cyan(p.newId)}   (${p.bad.length} 处 / ${stages})`)
    }
  }

  if (conflicted.length) {
    console.log(c.red(`\n▶ 冲突（需人工）${conflicted.length} 个：`))
    for (const p of conflicted.slice(0, 30)) {
      console.log(`  ${p.wordId}  — ${p.conflictReason}`)
    }
    if (conflicted.length > 30) console.log(c.gray(`  … 还有 ${conflicted.length - 30} 个`))
  }

  if (manual.length) {
    console.log(c.yellow(`\n▶ 无法自动推导 ${manual.length} 个（请人工处理）：`))
    for (const p of manual.slice(0, 30)) {
      console.log(`  ${p.wordId}  at ${[...new Set(p.bad.map((u) => `${u.lang}/${u.stage}`))].join(', ')}`)
    }
    if (manual.length > 30) console.log(c.gray(`  … 还有 ${manual.length - 30} 个`))
  }

  if (!APPLY) {
    console.log(c.gray('\n预览模式。加 --apply 落盘（仅自动修复部分）'))
    return
  }
  if (autoFixable.length === 0) {
    console.log(c.gray('\n没有可落盘的自动修复项'))
    return
  }

  // 4. 落盘：字符串级替换（保留原缩进/格式）
  const renameMap = new Map() // from -> to
  for (const p of autoFixable) renameMap.set(p.wordId, p.newId)

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const touchFiles = new Set(courses.map((co) => co.path))
  // 句子文件也一起改（sentence.words 引用）
  for (const dir of Object.values(LANG_DIR)) {
    touchFiles.add(join(SENTENCES_DIR, `${dir}_sentences.json`))
  }

  let changedFiles = 0
  for (const path of touchFiles) {
    let content
    try {
      content = await readFile(path, 'utf8')
    } catch {
      continue
    }
    let next = content
    for (const [from, to] of renameMap) {
      const re = new RegExp(`"${escapeRe(from)}"`, 'g')
      next = next.replace(re, `"${to}"`)
    }
    if (next !== content) {
      await writeFile(path, next, 'utf8')
      changedFiles++
    }
  }

  console.log(c.green(`\n✅ 已落盘：${changedFiles} 个文件，${renameMap.size} 个 id 改名`))
  console.log(c.gray('建议再跑 npm.cmd run check:courses 验证，并 git diff 复核。'))
}

main().catch((e) => {
  console.error(c.red('脚本异常：'), e)
  process.exit(2)
})
