import react from '@vitejs/plugin-react'
import { existsSync, promises as fs, readFileSync, readdirSync, writeFileSync } from 'fs'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import type { Plugin, PluginOption } from 'vite'

/**
 * Vite 插件：自动扫描 public/dicts/*.json，生成虚拟模块 virtual:dict-lengths
 * 输出的默认导出：{ "文件名.json": 词条数, ... }
 */
function dictLengthsPlugin(): Plugin {
  const virtualId = 'virtual:dict-lengths'
  const resolvedId = '\0' + virtualId

  return {
    name: 'dict-lengths',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) {
        const dictsDir = path.resolve(__dirname, 'public/dicts')
        const result: Record<string, number> = {}
        try {
          const files = readdirSync(dictsDir).filter((f) => f.endsWith('.json'))
          for (const file of files) {
            try {
              const content = JSON.parse(readFileSync(path.join(dictsDir, file), 'utf-8'))
              result[file] = Array.isArray(content) ? content.length : 0
            } catch (e) {
              console.warn(`[dict-lengths] 读取失败: ${file}`, e)
              result[file] = 0
            }
          }
        } catch (e) {
          console.warn('[dict-lengths] 无法扫描词典目录', e)
        }
        return `export default ${JSON.stringify(result)}`
      }
    },
  }
}

/**
 * Vite 插件：自动同步 public/courses/vietnamese/*.json 中的 words 到词典。
 * - 启动时同步一次
 * - 保存课程文件时自动同步
 * - 构建前同步一次
 * - 自动去重（按 id）
 * 你只需要把 course_NN.json 粘进目录，其它什么都不用做。
 */
function courseSyncPlugin(): Plugin {
  const dictDir = path.resolve(__dirname, 'public/dicts')
  const courseDir = path.resolve(__dirname, 'public/courses/vietnamese')

  function readJson<T = any>(file: string): T {
    return JSON.parse(readFileSync(file, 'utf-8')) as T
  }

  function writeJson(file: string, data: any) {
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  }

  function getCourseFiles(): string[] {
    if (!existsSync(courseDir)) return []
    return readdirSync(courseDir)
      .filter((f) => f.startsWith('course_') && f.endsWith('.json'))
      .map((f) => path.join(courseDir, f))
  }

  function getDictFiles(): string[] {
    if (!existsSync(dictDir)) return []
    return readdirSync(dictDir)
      .filter((f) => f.startsWith('vietnamese_') && f.endsWith('.json'))
      .map((f) => path.join(dictDir, f))
  }

  function syncCourses(): { added: number; existing: number } {
    const courseFiles = getCourseFiles()
    if (courseFiles.length === 0) return { added: 0, existing: 0 }

    // 1. 收集所有课程里的 word 对象
    const courseWords: any[] = []
    for (const file of courseFiles) {
      try {
        const course = readJson(file)
        if (Array.isArray(course.words)) {
          for (const w of course.words) {
            if (w && typeof w === 'object' && typeof w.id === 'string') {
              courseWords.push(w)
            }
          }
        }
      } catch (e: any) {
        console.warn(`[course-sync] 读取课程失败: ${file}`, e?.message ?? e)
      }
    }

    if (courseWords.length === 0) return { added: 0, existing: 0 }

    // 2. 收集词典已有 id
    const dictFiles = getDictFiles()
    const existingIds = new Set<string>()
    const dictCache = new Map<string, any[]>()
    for (const file of dictFiles) {
      try {
        const data = readJson<any[]>(file)
        if (Array.isArray(data)) {
          dictCache.set(file, data)
          for (const w of data) if (w && w.id) existingIds.add(w.id)
        }
      } catch (e: any) {
        console.warn(`[course-sync] 读取词典失败: ${file}`, e?.message ?? e)
      }
    }

    // 3. 找出缺失
    const missing: any[] = []
    let existing = 0
    for (const w of courseWords) {
      if (existingIds.has(w.id)) {
        existing++
      } else if (!missing.find((m) => m.id === w.id)) {
        missing.push(w)
      }
    }

    if (missing.length === 0) {
      console.log(`[course-sync] 全部已存在（${existing} 条），无需追加`)
      return { added: 0, existing }
    }

    // 4. 按 tags 里的等级分组，默认 A1
    const grouped = new Map<string, any[]>()
    for (const w of missing) {
      const tags: string[] = Array.isArray(w.tags) ? w.tags : []
      const levelTag = tags.find((t) => /^[ABC][12]$/.test(t)) || 'A1'
      const fileName = `vietnamese_${levelTag.toLowerCase()}.json`
      if (!grouped.has(fileName)) grouped.set(fileName, [])
      grouped.get(fileName)!.push(w)
    }

    // 5. 追加并去重
    for (const [fileName, words] of grouped) {
      const full = path.join(dictDir, fileName)
      let data: any[] = []
      if (dictCache.has(full)) {
        data = dictCache.get(full)!
      } else if (existsSync(full)) {
        data = readJson<any[]>(full)
      }
      const ids = new Set(data.map((w) => w && w.id))
      let addedThisFile = 0
      for (const w of words) {
        if (!ids.has(w.id)) {
          data.push(w)
          ids.add(w.id)
          addedThisFile++
        }
      }
      writeJson(full, data)
      console.log(`[course-sync] ${fileName}: 追加 ${addedThisFile} 条`)
    }

    return { added: missing.length, existing }
  }

  return {
    name: 'course-sync',

    configureServer(server) {
      const run = () => {
        try {
          const result = syncCourses()
          if (result.added > 0) {
            console.log(`[course-sync] 本次共追加 ${result.added} 条新词`)
          }
        } catch (e) {
          console.error('[course-sync] 同步失败:', e)
        }
      }

      // 启动时跑一次
      run()

      // 监听课程目录变化
      if (existsSync(courseDir)) {
        server.watcher.add(courseDir)
        const onChange = (file: string) => {
          const norm = file.replace(/\\/g, '/')
          if (norm.includes('/courses/') && norm.endsWith('.json')) {
            run()
          }
        }
        server.watcher.on('change', onChange)
        server.watcher.on('add', onChange)
      }
    },

    buildStart() {
      try {
        const result = syncCourses()
        if (result.added > 0) {
          console.log(`[course-sync] 构建前追加 ${result.added} 条新词`)
        }
      } catch (e) {
        console.error('[course-sync] 构建同步失败:', e)
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const latestCommitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'

  return {
    plugins: [
      react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
      visualizer() as PluginOption,
      dictLengthsPlugin(),
      courseSyncPlugin(),
      Icons({
        compiler: 'jsx',
        jsx: 'react',
        customCollections: {
          'my-icons': {
            xiaohongshu: () => fs.readFile('./src/assets/xiaohongshu.svg', 'utf-8'),
          },
        },
      }),
    ],
    build: {
      minify: true,
      outDir: 'build',
      sourcemap: false,
    },
    esbuild: {
      drop: mode === 'development' ? [] : ['console', 'debugger'],
    },
    define: {
      REACT_APP_DEPLOY_ENV: JSON.stringify(process.env.REACT_APP_DEPLOY_ENV),
      LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  }
})
