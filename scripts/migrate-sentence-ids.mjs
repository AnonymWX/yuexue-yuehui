#!/usr/bin/env node

/**
 * 迁移 sentence.id 到阶段命名空间
 * 旧: sentence_ko_001 / sentence_ko_201 / sentence_ko_401
 * 新: sentence_ko_a1_001 / sentence_ko_a2_001 / sentence_ko_a1_027
 *
 * 用法:
 *   node scripts/migrate-sentence-ids.mjs           # 预览
 *   node scripts/migrate-sentence-ids.mjs --apply   # 执行
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COURSES_DIR = path.join(ROOT, 'src', 'courses')
const SENTENCES_DIR = path.join(ROOT, 'src', 'sentences')

const APPLY = process.argv.includes('--apply')

const LANG_MAP = {
  vietnamese: 'vi',
  japanese: 'ja',
  korean: 'ko',
  english: 'en',
}

function scanCourses() {
  const map = new Map()
  for (const langDir of fs.readdirSync(COURSES_DIR)) {
    const langPath = path.join(COURSES_DIR, langDir)
    if (!fs.statSync(langPath).isDirectory()) continue
    const lang = LANG_MAP[langDir] || langDir
    for (const stageDir of fs.readdirSync(langPath)) {
      const stagePath = path.join(langPath, stageDir)
      if (!fs.statSync(stagePath).isDirectory()) continue
      for (const themeDir of fs.readdirSync(stagePath)) {
        const themePath = path.join(stagePath, themeDir)
        if (!fs.statSync(themePath).isDirectory()) continue
        const indexPath = path.join(themePath, 'index.json')
        if (!fs.existsSync(indexPath)) continue
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        for (const c of index.courses || []) {
          const coursePath = path.join(themePath, c.file)
          if (!fs.existsSync(coursePath)) {
            console.warn(`⚠️  缺文件: ${coursePath}`)
            continue
          }
          const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'))
          map.set(c.id, {
            lang,
            stage: stageDir,
            theme: themeDir,
            order: course.order || 0,
            sentenceIds: course.sentences || [],
            coursePath,
          })
        }
      }
    }
  }
  return map
}

function buildMapping(courseMap) {
  const groups = new Map()
  for (const [courseId, info] of courseMap) {
    const key = `${info.lang}_${info.stage}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ courseId, ...info })
  }
  const mapping = new Map()
  for (const [key, list] of groups) {
    list.sort((a, b) => a.order - b.order || a.courseId.localeCompare(b.courseId))
    let seq = 1
    for (const course of list) {
      for (const oldId of course.sentenceIds) {
        const newId = `sentence_${key}_${String(seq).padStart(3, '0')}`
        if (mapping.has(oldId)) {
          console.error(`❌ 冲突: ${oldId} 被多个 course 引用`)
          process.exit(1)
        }
        mapping.set(oldId, newId)
        seq++
      }
    }
  }
  return mapping
}

function applyMigration(mapping, courseMap) {
  let changed = 0
  for (const f of fs.readdirSync(SENTENCES_DIR)) {
    if (!f.endsWith('_sentences.json')) continue
    const p = path.join(SENTENCES_DIR, f)
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'))
    let localChanged = 0
    for (const s of arr) {
      if (mapping.has(s.id)) {
        s.id = mapping.get(s.id)
        localChanged++
      }
    }
    if (localChanged) {
      changed += localChanged
      if (APPLY) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + '\n', 'utf8')
      console.log(`📝 ${f}: ${localChanged} 条句子 id 改写`)
    }
  }
  for (const [, info] of courseMap) {
    const course = JSON.parse(fs.readFileSync(info.coursePath, 'utf8'))
    let localChanged = 0
    course.sentences = (course.sentences || []).map((oldId) => {
      if (mapping.has(oldId)) {
        localChanged++
        return mapping.get(oldId)
      }
      return oldId
    })
    if (localChanged) {
      changed += localChanged
      if (APPLY) fs.writeFileSync(info.coursePath, JSON.stringify(course, null, 4) + '\n', 'utf8')
    }
  }
  console.log(`\n✅ 共改写 ${changed} 处引用${APPLY ? '（已落盘）' : '（预览，加 --apply 落盘）'}`)
}

const courseMap = scanCourses()
console.log(`📚 扫描到 ${courseMap.size} 个 course`)
const mapping = buildMapping(courseMap)
console.log(`🔗 生成 ${mapping.size} 条 id 映射`)

console.log('\n预览（前 10 条）:')
let i = 0
for (const [o, n] of mapping) {
  console.log(`  ${o} → ${n}`)
  if (++i >= 10) {
    console.log('  ...')
    break
  }
}

if (APPLY) {
  console.log('\n🚀 开始落盘...')
  applyMigration(mapping, courseMap)
} else {
  console.log('\n💡 预览模式，加 --apply 落盘')
}
