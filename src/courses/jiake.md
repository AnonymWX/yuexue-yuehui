# 加课指南（越南语课程）

> 本文档用于在**新对话**中继续给本项目添加越南语课程。
> 把本文件全文贴给 AI，再说「继续加课，从 XXX 开始」，即可无缝接手。

---

## 一、项目背景

- 项目：qwerty-learner 改造版，越南语学习工具
- 项目根目录：`C:\Users\15261131\Desktop\study and research\qwertylearner-main\qwertylearner-main`
- 用户是 Windows，命令一律 CMD
- 本地验证：`npm.cmd run dev`
- 提交前构建：`npm.cmd run build`

---

## 二、目录结构（关键）

课程采用**主题分组**结构，每个主题一个文件夹，主题内的课从 1 独立编号。
public/courses/
├── index.json ← 顶层：列出每语言有哪些主题
└── vietnamese/
├── basic/
│ ├── index.json ← 主题信息 + 本主题课列表
│ ├── course_01.json
│ ├── course_02.json
│ └── ...
├── daily/
│ ├── index.json
│ └── course_01.json ...
├── social/
│ ├── index.json
│ └── course_01.json ...
├── travel/
│ ├── index.json
│ └── course_01.json ...
└── work/
└── index.json ← 只有 index，courses 为空数组

text

**5 个主题**（顺序即页面卡片顺序）：

| 主题 id | 中文名   | 越南语名  |
| ------- | -------- | --------- |
| basic   | 入门基础 | Cơ bản    |
| daily   | 生活场景 | Đời sống  |
| social  | 日常交流 | Giao tiếp |
| travel  | 旅行出行 | Du lịch   |
| work    | 工作学习 | Công việc |

---

## 三、三个 JSON 的职责

### 1. 顶层 `public/courses/index.json`

只列主题，不列课程。

```json
{
    "vi": ["basic", "daily", "social", "travel", "work"]
}
数组顺序 = 页面卡片顺序

加新主题：数组末尾加一项

加新语言：加 "en": [...]、"ja": [...]

2. 主题 public/courses/vietnamese/{主题}/index.json
主题元信息 + 本主题课列表。

json
{
    "id": "basic",
    "title": "入门基础",
    "titleVi": "Cơ bản",
    "courses": [
        { "id": "course_vi_01", "file": "course_01.json", "title": "第1课：打招呼", "titleVi": "Bài 1: Chào hỏi", "level": "A1" },
        ...
    ]
}
courses 数组顺序 = 主题内显示顺序

空数组 [] = 该主题显示「敬请期待」

每个课程条目必须有 file 字段，否则首页崩（c.file.match 报错）

3. 课程 public/courses/vietnamese/{主题}/course_XX.json
一课完整内容。

json
{
    "id": "course_vi_12",
    "title": "第4课：数字与年龄",
    "titleVi": "Bài 4: Số đếm và Tuổi",
    "level": "A1",
    "order": 4,
    "scenario": "basic",
    "goals": ["...", "..."],
    "words": [
        { "id": "vi_tuoi", "name": "tuổi", "trans": ["岁"], "tags": ["number", "A1"], "source": ["vietnamese_a1"] },
        ...
    ],
    "sentences": ["sentence_vi_067", "sentence_vi_068", ...],
    "grammar": [
        { "point": "...", "explain": "...", "examples": [{ "vi": "...", "zh": "..." }] }
    ],
    "telex": [],
    "exercises": [
        { "type": "choose", "question": "...", "options": ["A","B","C"], "answer": "A" },
        { "type": "fill", "question": "...", "answer": "..." },
        { "type": "telex_input", "question": "...", "answer": "..." }
    ]
}
4. 句子 public/sentences/vietnamese_sentences.json
全局一个文件，所有课的句子都追加在这里。

json
[
    {
        "id": "sentence_vi_067",
        "text": "Bạn bao nhiêu tuổi?",
        "translation": "你几岁？",
        "words": ["vi_tuoi"],
        "course": "course_vi_12",
        "tags": ["number", "A1"]
    },
    ...
]
words 存的是 CourseWord.id（如 vi_tuoi），不是文本

course 字段填课程的 id（如 course_vi_12）

句子 id 全局连续递增，不复用

四、命名规则（最重要，别搞混）
以 basic 第4课为例：

项目	值	说明
文件夹	basic/	主题 id
文件名	course_04.json	主题内序号，从 1 开始
课程 id	course_vi_12	全局唯一，只增不改
课程 order	4	主题内序号（跟文件名一致）
句子 id 段	sentence_vi_067 起	全局连续
单词 id 前缀	vi_xxx	全局唯一，别跟已有的撞
关键区别：

文件名 = 主题内序号（每个主题从 1 开始）

课程 id = 全局编号（course_vi_NN，所有主题共用一个序列，只增不改）

URL = /course/vi/{主题id}/{文件名数字}，例如 /course/vi/basic/04

五、加一课完整流程（4 步）
假设要给 daily 主题加第 4 课（市场与讲价）：

第 1 步：建课程 JSON
新建 public/courses/vietnamese/daily/course_04.json，内容照格式写。

新增课程的 id 是多少？ 看所有主题里当前最大编号 +1。

查法：CMD 跑

cmd
cd public\courses\vietnamese
findstr /s /r "course_vi_[0-9]*" *\index.json
或者干脆搜一下 course_vi_ 这个字符串，找出目前最大数字。截至本文档，最大是 course_vi_28，所以下一个新课程用 course_vi_29。

第 2 步：改主题 index.json
在 daily/index.json 的 courses 数组末尾追加一条：

json
{ "id": "course_vi_29", "file": "course_04.json", "title": "第4课：市场与讲价", "titleVi": "Bài 4: Chợ và Mặc cả", "level": "A1" }
第 3 步：追加句子
在 public/sentences/vietnamese_sentences.json 末尾追加 6 句（一课配 6 句）。

找到文件最后一条句子的 }，给它后面加英文逗号

粘新句子

最后保留原来的 ]

第 4 步：验证
cmd
npm.cmd run dev
检查：

/course → daily 卡片数字 +1

点 daily → 新课出现在列表

点新课 → 8 步流程能走完

六、课程内容格式要求
每课固定结构：

字段	数量	说明
goals	4 条	本课目标（中文）
words	8 个	新单词
sentences	6 条	句子 id 引用
grammar	2 条	语法点
exercises	3 条	练习（choose / fill / telex_input 各一）
单词格式：

json
{ "id": "vi_xxx", "name": "越南语词", "trans": ["中文1", "中文2"], "tags": ["主题", "A1"], "source": ["vietnamese_a1"] }
id 全局唯一，用 vi_ 前缀 + 下划线小写英文

name 写越南语原词（带声调）

trans 中文翻译，可多个

练习格式：

json
{ "type": "choose", "question": "「xxx」的中文意思是？", "options": ["A", "B", "C"], "answer": "A" }
{ "type": "fill", "question": "句子中有 ___。（提示）", "answer": "越南语答案" }
{ "type": "telex_input", "question": "请用越南语输入「xxx」", "answer": "越南语答案" }
七、内容编写原则
紧扣主题：课的内容必须符合所在主题

参考官方教材：

越南国家图书馆（NLV）A1 教材大纲

河内工业大学（HaUI）A 级教材

《越南语教程》《新编越南语口语教程》

难度递进：主题内后面的课不能比前面简单

语法点不重复：同一主题内，语法点尽量不撞

八、当前进度（截至本 MD 生成时）
basic（入门基础）：已完成 20 课 ✅
序号	标题	课程 id	文件名
1	打招呼	course_vi_01	course_01.json
2	家庭与职业	course_vi_02	course_02.json
3	时间与日常活动	course_vi_03	course_03.json
4	数字与年龄	course_vi_12	course_04.json
5	颜色与形状	course_vi_13	course_05.json
6	身体与健康	course_vi_14	course_06.json
7	学校与学习	course_vi_15	course_07.json
8	常用动词	course_vi_16	course_08.json
9	国家与国籍	course_vi_17	course_09.json
10	天气与季节（扩展）	course_vi_18	course_10.json
11	房屋与居住	course_vi_19	course_11.json
12	家具与物品	course_vi_20	course_12.json
13	比较级	course_vi_21	course_13.json
14	复习与综合练习	course_vi_22	course_14.json
15	年龄与出生	course_vi_23	course_15.json
16	星期与日期	course_vi_24	course_16.json
17	时间与钟点	course_vi_25	course_17.json
18	爱好与能力	course_vi_26	course_18.json
19	请求与建议	course_vi_27	course_19.json
20	入门阶段总复习	course_vi_28	course_20.json
daily（生活场景）：已完成 3 课，待加 4～20
序号	标题	课程 id	文件名
1	购物与价钱	course_vi_04	course_01.json
2	饮食与点餐	course_vi_05	course_02.json
3	问路与交通	course_vi_06	course_03.json
4	市场与讲价	待加	course_04.json
5	餐厅与菜单	待加	course_05.json
...	...	...	...
20	生活场景总复习	待加	course_20.json
social（日常交流）：已完成 2 课，待加 3～20
序号	标题	课程 id	文件名
1	天气与季节	course_vi_07	course_01.json
2	爱好与休闲	course_vi_08	course_02.json
3	描述人物	待加	course_03.json
...	...	...	...
travel（旅行出行）：已完成 3 课，待加 4～20
序号	标题	课程 id	文件名
1	订酒店与住宿	course_vi_09	course_01.json
2	换钱与银行	course_vi_10	course_02.json
3	紧急情况与求助	course_vi_11	course_03.json
4	交通与购票	待加	course_04.json
...	...	...	...
work（工作学习）：0 课，待加 1～20
全部待加。

九、完整课程规划（20 课/主题）
daily（生活场景）
序号	主题	语法点
4	市场与讲价	bớt、đắt/rẻ
5	餐厅与菜单	gọi món、món ăn
6	咖啡与饮品	ly/cốc、uống
7	超市与日用品	mua sắm、siêu thị
8	理发店与美容	cắt tóc、làm đẹp
9	邮局与快递	gửi thư、bưu kiện
10	药店与买药	thuốc、đơn thuốc
11	医院与看病	khám bệnh、bác sĩ
12	银行与开户	mở tài khoản
13	手机与网络	điện thoại、wifi
14	水电与缴费	hóa đơn、tiền điện
15	租房与买房	thuê nhà、hợp đồng
16	家政与维修	sửa chữa、dọn dẹp
17	宠物与动物	con mèo、con chó
18	节日与庆祝	Tết、sinh nhật
19	邀请与聚会	mời、dự tiệc
20	生活场景总复习	1-19课整合
social（日常交流）
序号	主题	语法点
3	描述人物	cao/thấp、đẹp/xấu
4	描述物品	to/nhỏ、mới/cũ
5	表达感受	vui/buồn、thấy
6	表达意见	nghĩ、theo tôi
7	同意与反对	đồng ý、phản đối
8	道歉与原谅	xin lỗi、tha lỗi
9	感谢与回应	cảm ơn、không có gì
10	赞美与鼓励	giỏi、cố lên
11	抱怨与投诉	phàn nàn、khiếu nại
12	建议与劝告	nên、đừng
13	承诺与约定	hứa、hẹn
14	电话与短信	gọi điện、nhắn tin
15	网络社交	mạng xã hội、đăng bài
16	谈论过去	đã + 动词
17	谈论未来	sẽ + 动词
18	谈论正在发生	đang + 动词
19	综合对话练习	情景对话整合
20	日常交流总复习	1-19课整合
travel（旅行出行）
序号	主题	语法点
4	交通与购票	vé、ga、sân bay
5	飞机与机场	máy bay、check-in
6	火车与长途汽车	tàu hỏa、xe khách
7	租车与自驾	thuê xe、bằng lái
8	出租车与网约车	taxi、xe ôm
9	问路与指路（进阶）	rẽ trái/phải、đi thẳng
10	景点与门票	điểm du lịch、vé vào cửa
11	导游与讲解	hướng dẫn viên
12	拍照与纪念品	chụp ảnh、quà lưu niệm
13	旅行计划与行程	kế hoạch、lịch trình
14	露营与户外	cắm trại、dã ngoại
15	海边与游泳	biển、bơi
16	山区与徒步	núi、leo núi
17	城市观光	thành phố、tham quan
18	乡村与民宿	nông thôn、homestay
19	旅行问题与解决	mất đồ、lạc đường
20	旅行出行总复习	1-19课整合
work（工作学习）
序号	主题	语法点
1	职业与职位	nghề nghiệp、chức vụ
2	公司部门	phòng ban、công ty
3	求职与面试	phỏng vấn、CV
4	简历与自我介绍	sơ yếu lý lịch
5	工作日常	đi làm、tan ca
6	会议与讨论	cuộc họp、thảo luận
7	邮件与沟通	email、liên lạc
8	电话与留言	gọi điện、để lại lời nhắn
9	汇报与演示	báo cáo、thuyết trình
10	谈判与合同	đàm phán、hợp đồng
11	请假与加班	xin nghỉ、làm thêm giờ
12	工资与福利	lương、phúc lợi
13	同事与关系	đồng nghiệp、quan hệ
14	出差与考察	công tác、khảo sát
15	学校与课程	khóa học、môn học
16	考试与成绩	thi、điểm
17	图书馆与自习	thư viện、tự học
18	论文与作业	luận văn、bài tập
19	留学与申请	du học、hồ sơ
20	工作学习总复习	1-19课整合
十、常见坑（踩过的）
c.file.match 报错 → 某课程的 index.json 条目缺 file 字段。每个条目必须有 file。

课程 id 重复 → course_vi_NN 全局唯一，加课前先搜最大编号。

句子 id 重复 → sentence_vi_NNN 全局连续，加课前先看最后一条。

单词 id 重复 → 同一个 vi_xxx 不能出现在两课里。已知历史遗留：vi_ban 在第4课（bán 卖）和第8课（bạn 朋友）都用了，将来需修。

JSON 尾逗号 → 数组最后一个对象后不能有逗号，否则解析失败、整页空白。

文件名扩展名 → VS Code 新建文件必须打全 .json，标题栏没 ● 才算保存。

主题内序号 → 文件名和 order 都从 1 开始，跟全局 course_vi_NN 不是一回事。

URL 拼接 → 前端用文件名数字，不是课程 id。/course/vi/basic/04 对应 basic/course_04.json。

十一、新对话如何开始
把本 MD 全文贴给 AI，然后说：

继续加课，从 daily 第4课开始，一批5课。

或者：

继续加课，从 work 第1课开始，一批5课。

AI 就会按本 MD 的规则输出。每批 5 课，验证通过再下一批。

十二、快速命令备忘
cmd
:: 启动
npm.cmd run dev

:: 构建
npm.cmd run build

:: 查当前最大课程 id（在项目根目录跑）
findstr /s /r "course_vi_[0-9][0-9]*" public\courses\vietnamese\*\index.json

:: 查最后一个句子 id（在项目根目录跑）
findstr /r "sentence_vi_[0-9][0-9]*" public\sentences\vietnamese_sentences.json

:: 清所有学习进度（浏览器 F12 Console）
localStorage.clear()
location.reload()
十三、关键文件清单
text
public/
├── courses/
│   ├── index.json                        ← 顶层主题列表
│   └── vietnamese/
│       ├── basic/index.json              ← basic 主题课列表（20课）
│       ├── daily/index.json              ← daily 主题课列表（3课）
│       ├── social/index.json             ← social 主题课列表（2课）
│       ├── travel/index.json             ← travel 主题课列表（3课）
│       └── work/index.json               ← work 主题课列表（空）
└── sentences/
    └── vietnamese_sentences.json         ← 所有句子（168条）

src/
└── pages/
    ├── Home/index.tsx                    ← 首页（读全部进度 + 主题扁平化）
    └── Course/
        ├── index.tsx                     ← 主题卡片页
        ├── LanguageCourseList.tsx        ← 主题内课程列表页
        ├── CourseDetail/index.tsx        ← 课程入口
        ├── hooks/
        │   ├── useCourse.ts              ← 数据加载（useCourseStructure / useTheme / useCourse）
        │   └── useLessonStatus.ts        ← 进度状态（useAllLessonProgress / getLessonStatus）
        └── player/
            ├── LessonPlayer.tsx          ← 8步播放器
            └── FinishScreen.tsx          ← 完成页
```
