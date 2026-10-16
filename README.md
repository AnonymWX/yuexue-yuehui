# 🌏 越学越会 (yuexue-yuehui)

一款基于 qwerty-learner 改造的开源多语言打字与沉浸式学习工具。专注于**越南语、日语、韩语**的科学记忆与场景化进阶，提供从「零基础入门」到「高阶表达」的完整学习闭环。

🔗 **在线体验**：[https://yuexue-yuehui.vercel.app](https://yuexue-yuehui.vercel.app)
📂 **GitHub**：[https://github.com/AnonymWX/yuexue-yuehui](https://github.com/AnonymWX/yuexue-yuehui)

---

## ✨ 核心特性 (Features)

### 🎯 科学的学习路径与阶段解锁
- **CEFR 分级体系**：严格的 A1 / A2 / B1 阶段划分。
- **动态阶段解锁**：A1 阶段全部通关后，系统自动解锁 A2 进阶内容，让学习充满“打怪升级”的目标感。
- **8 步沉浸式学习流**：目标 → 单词 → 句子 → 理解 → 语法 → 听力 → 听写 → 测试，全方位掌握每一个知识点。
- **智能首页仪表盘**：根据时间段动态问候，实时展示连续打卡天数、课程进度与阶段解锁状态，附带「每日一句」语音朗读。

### ️ 多语言原生输入引擎 (State Machine)
告别传统的复制粘贴，内置高精度状态机输入引擎，还原真实母语打字体验：
- 🇳 **越南语**：Telex 输入法（完美支持 5 个声调与字母变形）
- 🇯🇵 **日语**：Romaji 罗马字输入法（平假名/片假名实时转换）
- 🇰🇷 **韩语**：2-beolsik (두벌식) 键盘布局（支持复合元音与终声组合）

### 🧠 科学的记忆与复习系统
- **SM-2 记忆曲线**：基于艾宾浩斯遗忘曲线，智能安排每日 10 词复习。
- **错词优先机制**：复习时优先抽取高频错词，精准击破薄弱环节。
- **多维数据看板**：提供总正确率、错词 Top10、30 天学习柱状图等可视化统计。

### 🎨 极致的视觉与交互体验
- **4 套专属主题**：越（热情）、竹（清新）、莲（优雅）、夜（护眼），全站语义化 UI 完美适配。
- **智能输入法提示 (InputHint)**：顶部横条 + 右下角悬浮面板，跟随语言自动切换输入规则提示。
- **云端多端同步**：基于 Supabase 实现账号登录与学习进度云端同步。

---

## 📚 当前内容进度

| 语言 | 阶段 | 状态 | 内容规模 | 教材参考 |
| :--- | :--- | :---: | :--- | :--- |
| 🇻🇳 **越南语** | A1 | ✅ 满编 | 16 主题 / 104 课 / ~832 词 | 基础日常场景 |
| 🇻🇳 **越南语** | A2 | ✅ 满编 | 8 主题 / 45 课 / ~630 词 | 进阶场景交流 |
| 🇵 **日语** | A1 |  试点 | 1 主题 / 1 课 | 《大家的日语》初级 I |
| 🇰🇷 **韩语** | A1 | 🚧 试点 | 1 主题 / 1 课 | 《首尔大学韩国语》1A |

---

## 🛠️ 技术栈 (Tech Stack)

- **前端框架**：React 18 + TypeScript + Vite
- **状态管理**：Jotai (原子化状态)
- **样式与主题**：TailwindCSS (支持 CSS 变量动态主题切换)
- **后端与数据库**：Supabase (Auth + PostgreSQL + RLS 行级安全)
- **语音合成**：Web Speech API (speechSynthesis 本地语音包优先)
- **部署**：Vercel

---

## 🚀 快速开始 (Getting Started)

### 1. 克隆项目
```bash
git clone https://github.com/AnonymWX/yuexue-yuehui.git
cd yuexue-yuehui

### 2. 安装依赖
```bash
npm install


### 3. 配置环境变量 (可选，用于云端同步)
在项目根目录创建 .env 文件，填入你的 Supabase 凭证：
env

12
(注：不配置环境变量也可正常运行，学习进度将保存在本地 localStorage)
### 4. 启动开发服务器
bash


打开浏览器访问 http://localhost:5173。
### 5. 构建与部署
bash

1
构建产物输出至 dist/ 目录，可直接部署至 Vercel、Netlify 或任何静态服务器。
📂 项目结构 (Project Structure)
text

1234567891011121314151617
贡献与加课 (Contributing)
本项目拥有极其完善的课程数据校验体系。如果你想为项目添加新的语言、新的主题或新的课程，请参考项目内部的 jiake.md (加课指南)。
加课简易流程：
在 src/courses/<lang>/<stage>/<theme>/ 下新建 JSON 文件。
运行数据一致性检查：npm run check:courses
运行内容错位扫描：node scripts/diagnose-content.mjs
本地预览确认无误后提交 PR。
## 🙏 致谢 (Acknowledgements)
本项目核心交互灵感来源于 qwerty-learner，感谢原作者为键盘学习者做出的卓越贡献。
感谢所有为多语言输入状态机 (Telex/Romaji/Beolsik) 提供算法参考的开源社区。
## 📄 许可证 (License)
本项目基于 MIT License 开源。欢迎 Fork、Star 和 PR！
