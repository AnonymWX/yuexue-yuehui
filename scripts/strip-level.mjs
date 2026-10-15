#!/usr/bin/env node
// scripts/strip-level.mjs
// 从所有课程 JSON 里移除冗余的 level 字段
// 用法：node scripts/strip-level.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COURSES_DIR = join(__dirname, '..', 'src', 'courses')

let touched = 0
let removed = 0

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      await walk(p)
      continue
    }
    if (!e.name.endsWith('.json')) continue

    const raw = await readFile(p, 'utf8')
    const data = JSON.parse(raw)

    let changed = false

    // 顶层 level
    if ('level' in data) {
      delete data.level
      changed = true
      removed++
    }

    // courses[].level
    if (Array.isArray(data.courses)) {
      for (const c of data.courses) {
        if (c && 'level' in c) {
          delete c.level
          changed = true
          removed++
        }
      }
    }

    if (changed) {
      await writeFile(p, JSON.stringify(data, null, 4) + '\n', 'utf8')
      console.log('  ✓', p.replace(COURSES_DIR, 'src/courses').replace(/\\/g, '/'))
      touched++
    }
  }
}

await walk(COURSES_DIR)
console.log(`\n处理 ${touched} 个文件，移除 ${removed} 处 level 字段`)
