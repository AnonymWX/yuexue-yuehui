#!/usr/bin/env node

/**
 * 找出没被任何 course.sentences[] 引用的句子
 * 用法: node scripts/find-orphan-sentences.mjs
 *       node scripts/find-orphan-sentences.mjs --delete   # 直接删除孤儿
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COURSES_DIR = path.join(ROOT, 'src', 'courses')
const SENTENCES_DIR = path.join(ROOT, 'src', 'sentences')
const DELETE = process.argv.includes('--delete')

const LANG_MAP = { vietnamese: 'vi', japanese: 'ja', korean: 'ko', english: 'en' }

function collectReferenced() {
  const refs = new Set()
  for (const langDir of fs.readdirSync(COURSES_DIR)) {
    const langPath = path.join(COURSES_DIR, langDir)
    if (!fs.statSync(langPath).isDirectory()) continue
    for (const stageDir of fs.readdirSync(langPath)) {
      const stagePath = path.join(langPath, stageDir)
      if (!fs.statSync(stagePath).isDirectory()) continue
      for (const themeDir of fs.readdirSync(stagePath)) {
        const themePath = path.join(stagePath, themeDir)
        if (!fs.statSync(themePath).isDirectory()) continue
        const idx = path.join(themePath, 'index.json')
        if (!fs.existsSync(idx)) continue
        const index = JSON.parse(fs.readFileSync(idx, 'utf8'))
        for (const c of index.courses || []) {
          const cp = path.join(themePath, c.file)
          if (!fs.existsSync(cp)) continue
          const course = JSON.parse(fs.readFileSync(cp, 'utf8'))
          for (const sid of course.sentences || []) refs.add(sid)
        }
      }
    }
  }
  return refs
}

function main() {
  const refs = collectReferenced()
  console.log(`📚 课程引用的句子: ${refs.size} 条\n`)

  for (const f of fs.readdirSync(SENTENCES_DIR)) {
    if (!f.endsWith('_sentences.json')) continue
    const p = path.join(SENTENCES_DIR, f)
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'))
    const orphans = arr.filter((s) => !refs.has(s.id))
    if (orphans.length === 0) {
      console.log(`${f}: ${arr.length} 条，无孤儿 ✅`)
      continue
    }
    console.log(`${f}: ${arr.length} 条，孤儿 ${orphans.length} 条 ⚠️`)
    for (const s of orphans) {
      console.log(`  ${s.id}  course=${s.course || '(空)'}  text="${(s.text || '').slice(0, 30)}"`)
    }
    if (DELETE) {
      const kept = arr.filter((s) => refs.has(s.id))
      fs.writeFileSync(p, JSON.stringify(kept, null, 4) + '\n', 'utf8')
      console.log(`  → 已删除 ${orphans.length} 条，剩 ${kept.length} 条`)
    }
    console.log('')
  }
}

main()
