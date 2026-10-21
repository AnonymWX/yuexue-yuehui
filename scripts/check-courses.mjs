#!/usr/bin/env node
// scripts/check-courses.mjs
// v8：Schema 校验 / 练习答案 / 句子引用 / title+order / 跨阶段 word.id / 同名不同义降级 warning
// 用法：node scripts/check-courses.mjs（或 npm.cmd run check:courses）
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COURSES_DIR = join(ROOT, 'src', 'courses')
const SENTENCES_DIR = join(ROOT, 'src', 'sentences')

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

const LANG_DIR = { vi: 'vietnamese', en: 'english', ja: 'japanese', ko: 'korean' }

// 阶段 → word.id 期望正则
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
  } catch (e) {
    addProblem('JSON 解析失败', rel(p), e.message)
    return null
  }
}

function checkExercise(ex, ctx, lang) {
  if (!ex || typeof ex !== 'object') {
    addProblem('练习格式错误', 'exercise 不是对象', ctx)
    return
  }
  if (!ex.type) {
    addProblem('练习缺 type', JSON.stringify(ex).slice(0, 80), ctx)
    return
  }
  if (!ex.question || String(ex.question).trim() === '') {
    addProblem('练习缺 question', `type=${ex.type}`, ctx)
  }
  if (ex.type === 'choose') {
    if (!Array.isArray(ex.options) || ex.options.length < 2) {
      addProblem('选择题 options 不足', `"${ex.question ?? ''}"`, ctx)
    } else if (!ex.options.includes(ex.answer)) {
      addProblem(
        '选择题 answer 不在 options',
        `"${ex.question ?? ''}" answer=${JSON.stringify(ex.answer)} options=${JSON.stringify(ex.options)}`,
        ctx,
      )
    }
  } else if (ex.type === 'fill') {
    if (!ex.answer || String(ex.answer).trim() === '') {
      addProblem('填空题缺 answer', `"${ex.question ?? ''}"`, ctx)
    }
  } else if (ex.type === 'telex_input') {
    if (lang !== 'vi') addProblem('telex_input 非越南语', `语言 "${lang}" 不应使用 telex_input`, ctx)
    if (!ex.answer || String(ex.answer).trim() === '') {
      addProblem('telex_input 缺 answer', `"${ex.question ?? ''}"`, ctx)
    }
  } else {
    addProblem('未知练习 type', `"${ex.type}"`, ctx)
  }
}

function checkGrammar(g, ctx) {
  if (!g || typeof g !== 'object') {
    addProblem('语法项格式错误', '', ctx)
    return
  }
  if (!g.point) addProblem('语法缺 point', '', ctx)
  if (!g.explain) addProblem('语法缺 explain', g.point || '', ctx)
  if (!Array.isArray(g.examples) || g.examples.length === 0) {
    addProblem('语法缺 examples', g.point || '', ctx)
    return
  }
  for (const ex of g.examples) {
    if (typeof ex !== 'object' || ex === null) {
      addProblem('语法 example 格式错误', g.point || '', ctx)
      continue
    }
    if (!ex.vi) addWarning('语法 example 缺 vi', `${g.point || ''} → ${JSON.stringify(ex).slice(0, 60)}`, ctx)
    if (!ex.zh) addWarning('语法 example 缺 zh', `${g.point || ''} → ${JSON.stringify(ex).slice(0, 60)}`, ctx)
    const extra = Object.keys(ex).filter((k) => k !== 'vi' && k !== 'zh')
    if (extra.length) addWarning('语法 example 多余键名', `${g.point || ''} 含 [${extra.join(',')}]（应仅 vi / zh）`, ctx)
  }
}

function checkTitle(title, expectedNum, ctx) {
  if (!title) {
    addProblem('缺少 title', '', ctx)
    return
  }
  const m = String(title).match(/第\s*(\d+)\s*[课課]/)
  if (!m) {
    addWarning('title 格式不符', `"${title}"（期望「第 X 课：…」）`, ctx)
    return
  }
  if (Number(m[1]) !== expectedNum) {
    addWarning('title 序号不符', `"${title}"，主题内序号应为 ${expectedNum}`, ctx)
  }
}

async function main() {
  const topIndex = await readJSON(join(COURSES_DIR, 'index.json'))
  if (!topIndex) return report()

  const stats = { themes: 0, courses: 0, words: 0, sentences: 0 }
  const seenCourseIds = new Map()
  const seenWordIds = new Map() // id -> { file, name }
  const reusedSameName = new Set()
  const allWordIds = new Set()
  const sentenceFiles = new Map() // lang -> { path, byId, raw }
  const sentenceRefs = new Map() // sentence.id -> Set<course.id>

  // 预读句子文件
  for (const [lang, dir] of Object.entries(LANG_DIR)) {
    const p = join(SENTENCES_DIR, `${dir}_sentences.json`)
    try {
      const arr = JSON.parse(await readFile(p, 'utf8'))
      if (Array.isArray(arr)) {
        const byId = new Map()
        for (const it of arr) if (it && it.id) byId.set(it.id, it)
        sentenceFiles.set(lang, { path: p, byId, raw: arr })
        stats.sentences += arr.length
      }
    } catch {
      // 句子文件可能不存在（如 en），忽略
    }
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

      const wordPattern = expectedWordPattern(lang, stage.id)

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

        for (let i = 0; i < themeIndex.courses.length; i++) {
          const course = themeIndex.courses[i]
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
          if (courseData.scenario !== theme) {
            addProblem('scenario 不符', `scenario="${courseData.scenario}"，主题目录="${theme}"`, rel(coursePath))
          }

          // Schema
          checkTitle(courseData.title, i + 1, rel(coursePath))
          if (!courseData.titleVi) addWarning('缺少 titleVi', `course "${course.id}"`, rel(coursePath))
          if (typeof courseData.order !== 'number') {
            addProblem('缺少 order', `course "${course.id}"`, rel(coursePath))
          } else if (courseData.order !== i + 1) {
            addWarning('order 不连续', `course "${course.id}" order=${courseData.order}，主题内位置=${i + 1}`, rel(coursePath))
          }
          if (!Array.isArray(courseData.goals) || courseData.goals.length === 0) {
            addWarning('缺少 goals', `course "${course.id}"`, rel(coursePath))
          }

          // words
          if (!Array.isArray(courseData.words) || courseData.words.length === 0) {
            addProblem('缺少 words', `course "${course.id}"`, rel(coursePath))
          } else {
            for (const w of courseData.words) {
              stats.words++
              if (!w.id) {
                addProblem('词条缺 id', `course "${course.id}"`, rel(coursePath))
                continue
              }
              if (!w.name) {
                addProblem('词条缺 name', `"${w.id}"`, rel(coursePath))
                continue
              }
              if (!Array.isArray(w.trans) || w.trans.length === 0) {
                addProblem('词条缺 trans', `"${w.id}" (${w.name})`, rel(coursePath))
              }

              allWordIds.add(w.id)

              // P0-2：跨阶段前缀
              if (wordPattern && !wordPattern.test(w.id)) {
                addProblem('跨阶段 word.id', `"${w.id}" 不属于 ${lang}-${stage.id} 阶段`, rel(coursePath))
              }

              // 重复 id：同 name 静默复用；不同 name 降级 warning
              if (seenWordIds.has(w.id)) {
                const prev = seenWordIds.get(w.id)
                if (prev.name === w.name) {
                  reusedSameName.add(w.id)
                } else {
                  addWarning(
                    '同名不同义 word.id',
                    `"${w.id}"`,
                    `\n      A: ${prev.file} ("${prev.name}")\n      B: ${rel(coursePath)} ("${w.name}")`,
                  )
                }
              } else {
                seenWordIds.set(w.id, { file: rel(coursePath), name: w.name })
              }
            }
          }

          // sentences 引用
          if (!Array.isArray(courseData.sentences) || courseData.sentences.length === 0) {
            addProblem('缺少 sentences', `course "${course.id}"`, rel(coursePath))
          } else {
            const sf = sentenceFiles.get(lang)
            for (const sid of courseData.sentences) {
              if (!sf) {
                addProblem('句子文件缺失', `语言 "${lang}" 无 ${LANG_DIR[lang]}_sentences.json`, rel(coursePath))
                break
              }
              if (!sf.byId.has(sid)) {
                addProblem('句子引用缺失', `course "${course.id}" 引用 "${sid}"，句子文件中不存在`, rel(coursePath))
              } else {
                const set = sentenceRefs.get(sid) ?? new Set()
                set.add(course.id)
                sentenceRefs.set(sid, set)
              }
            }
          }

          // grammar
          if (!Array.isArray(courseData.grammar) || courseData.grammar.length === 0) {
            addWarning('缺少 grammar', `course "${course.id}"`, rel(coursePath))
          } else {
            for (const g of courseData.grammar) checkGrammar(g, rel(coursePath))
          }

          // exercises
          if (!Array.isArray(courseData.exercises) || courseData.exercises.length === 0) {
            addProblem('缺少 exercises', `course "${course.id}"`, rel(coursePath))
          } else {
            for (const ex of courseData.exercises) checkExercise(ex, rel(coursePath), lang)
          }

          if (courseData.telex !== undefined && !Array.isArray(courseData.telex)) {
            addProblem('telex 应为数组', `course "${course.id}"`, rel(coursePath))
          }
        }
      }
    }
  }

  // 句子文件级校验（v8：words 按整条格式判定，分词格式只汇总不逐条报）
  for (const [lang, sf] of sentenceFiles) {
    const expected = new RegExp(`^sentence_${lang}_[ab]\\d_\\d{3}$`)
    const tokenStyle = []
    const isIdLike = (x) => typeof x === 'string' && /^[a-z][a-z0-9_]*$/.test(x)

    for (const s of sf.raw) {
      if (!s || !s.id) {
        addWarning('句子缺 id', '', rel(sf.path))
        continue
      }
      if (!expected.test(s.id)) {
        addWarning('sentence.id 格式不符', `"${s.id}"（期望 sentence_${lang}_<stage>_XXX）`, rel(sf.path))
      }
      if (!s.text) addProblem('句子缺 text', `"${s.id}"`, rel(sf.path))
      if (!s.translation) addWarning('句子缺 translation', `"${s.id}"`, rel(sf.path))

      if (!Array.isArray(s.words)) {
        addWarning('句子缺 words', `"${s.id}"`, rel(sf.path))
      } else if (s.words.length > 0) {
        if (s.words.every(isIdLike)) {
          for (const wid of s.words) {
            if (!allWordIds.has(wid)) {
              addWarning('句子 words 引用未定义', `"${s.id}" → "${wid}" 不在任何课程 words 中`, rel(sf.path))
            }
          }
        } else {
          tokenStyle.push(s.id)
        }
      }

      const refs = sentenceRefs.get(s.id)
      if (!refs || refs.size === 0) {
        addWarning('孤儿句子', `"${s.id}" 未被任何课程引用`, rel(sf.path))
      } else if (refs.size === 1 && s.course && !refs.has(s.course)) {
        addWarning('句子 course 不一致', `"${s.id}" course="${s.course}"，实际被 ${[...refs][0]} 引用`, rel(sf.path))
      }
    }

    if (tokenStyle.length > 0) {
      addWarning(
        '句子 words 使用目标语言分词',
        `${rel(sf.path)} 中 ${tokenStyle.length} 条句子的 words 是分词而非 word.id，已跳过 id 校验`,
        tokenStyle.slice(0, 5).join(', ') + (tokenStyle.length > 5 ? ' …' : ''),
      )
    }
  }

  if (reusedSameName.size > 0) {
    addWarning(
      '复用 word.id（同名）',
      `${reusedSameName.size} 个 id 在多课重复定义，buildWordPool 会去重`,
      [...reusedSameName].slice(0, 10).join(', ') + (reusedSameName.size > 10 ? ' …' : ''),
    )
  }

  report(stats)
}

function report(stats) {
  const line = c.gray('─'.repeat(64))
  console.log(line)
  if (stats) {
    console.log(`扫描：${stats.themes} 个主题 / ${stats.courses} 节课 / ${stats.words} 个词条 / ${stats.sentences} 条句子`)
  }
  console.log(line)

  if (warnings.length > 0) {
    const byType = {}
    for (const w of warnings) (byType[w.type] ||= []).push(w)
    console.log(c.yellow(`\n⚠️  warning 共 ${warnings.length} 处（不阻断）`))
    for (const [type, items] of Object.entries(byType)) {
      console.log(c.yellow(`  [${type}] ${items.length} 处`))
      for (const w of items.slice(0, 5)) {
        console.log(`    ${w.msg}`)
        if (w.detail) console.log(c.gray(`      ${w.detail}`))
      }
      if (items.length > 5) console.log(c.gray(`    … 还有 ${items.length - 5} 处`))
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
    for (const p of items.slice(0, 15)) {
      console.log(`  ${p.msg}`)
      if (p.detail) console.log(c.gray(`  ${p.detail}`))
    }
    if (items.length > 15) console.log(c.gray(`  … 还有 ${items.length - 15} 处`))
  }

  console.log('')
  console.log(c.red(`总计 ${problems.length} 处错误，${warnings.length} 处 warning`))
  process.exit(1)
}

main().catch((e) => {
  console.error(c.red('脚本异常：'), e)
  process.exit(2)
})
