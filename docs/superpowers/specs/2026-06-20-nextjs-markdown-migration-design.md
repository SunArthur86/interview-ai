# ai-interview → Next.js + Markdown 改造设计

- **日期**: 2026-06-20
- **项目**: `ai-interview`（先改造此项目，`java-interview` 后续同法）
- **状态**: 设计已与用户确认，待实现

## 1. 背景与目标

当前 `ai-interview` 是纯前端静态站（HTML + CSS + Vanilla JS），数据以大块 JSON 数组存放在
`data/*.json`（每文件 50–237 题），浏览器启动时 `fetch()` 全部 JSON 并 flat 成一个大数组渲染。
题目与答案混在 JSON 里，不易逐题编辑、不利于版本 diff、难以作为知识沉淀。

**目标**：
1. 把题目按分类写到不同文件夹，**每题一个 markdown 文件**（frontmatter + body）。
2. 页面读取 markdown 获取答案内容。
3. 选用 Next.js 重写（全量功能一次到位），部署到 GitHub Pages 静态导出。
4. 改造后测试 5 轮并优化，确保零功能回归、零用户数据丢失。

## 2. 现状（关键事实）

- 两项目（`ai-interview`、`java-interview`）共享 `interview-framework/`（app.js 53KB / study.js / forgetting.js）。
- `ai-interview` 共 **911 道唯一题目**，分布在 7 个分类（题与分类多对多，27 题跨分类）：
  - `llm-core` 272 · `ai-agent` 250 · `ai-harness` 144 · `fde` 32 · `eng-practice` 137 · `ai-basics` 68 · `ai-scenario` 50
  - 跨分类：15 题 ∈ {ai-agent, eng-practice, llm-core}；12 题 ∈ {eng-practice, llm-core}
- 单题字段：`question, answer(markdown), images[], difficulty, id, category, subcategory, tags[], follow_up[], feynman{essence, analogy, key_points[]}, first_principle{problem, axioms[], rebuild}`
- 部署：`sunarthur86.github.io/ai-interview`（GitHub Pages + PWA）。
- localStorage key 前缀 `ai-interview.`（收藏/笔记/评分/复习进度等，**必须兼容**）。
- 工具链可用：Node 25 / npm 11 / pnpm 11 / Python 3.14。

## 3. 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | Next.js 15 (App Router) + React 19 | SSG 静态导出适配 GitHub Pages |
| 语言 | TypeScript | 题目结构与复习算法复杂，类型保安全 |
| 样式 | Tailwind CSS v4 | 替代手写 CSS，暗色模式简单 |
| Markdown | react-markdown + remark-gfm + rehype-highlight | 替代手写 renderMarkdown，支持表格/代码/GFM |
| Frontmatter | gray-matter（构建时） | Next.js 构建时读 .md 解析 |
| 状态/存储 | Zustand + persist 中间件 | 替代散落的 localStorage 调用，统一管理 |
| 数据获取 | 构建时读 .md（getStaticProps / 构建期解析） | 运行时零 fetch，首屏即含答案 |
| 部署 | `output: 'export'` + `basePath: '/ai-interview'` | GitHub Pages |
| PWA | @serwist/next | Service Worker 离线 |

## 4. 数据流（核心改变）

```
questions/<category>/<id>.md        ← 唯一真理源（人/脚本编辑）
        │  Next.js build：gray-matter 解析 frontmatter + 提取 body
        ▼
src/lib/questions.ts                ← 构建期生成题目集合（含全部字段）
        │  注入静态页面（首页列表 + /question/[id] 详情）
        ▼
静态 HTML（已含答案）               ← 部署到 GitHub Pages
```

- 运行时**不需要 fetch**：题目在构建期全部解析，答案直接编译进静态 HTML。
- "页面读取 markdown 获取答案" 在**构建期**完成（gray-matter 解析 .md → 注入页面）。
- 跨分类题：单份 .md 放在主分类目录，frontmatter `categories` 字段记录所有归属分类，
  构建期据此让该题出现在多个分类视图。

## 5. .md 文件格式

```markdown
---
id: llm-001
difficulty: L2
category: llm-core
categories: [llm-core, ai-agent]        # 跨分类归属；单分类可省略（默认取 category）
subcategory: Transformer架构
tags: [Transformer, 自注意力]
images: [svg_transformer.svg]
feynman:
  essence: 一句话本质
  analogy: 大白话类比
  key_points:
    - 要点1
    - 要点2
first_principle:
  problem: 根本问题
  axioms:
    - 公理1
  rebuild: 从零重建
follow_up:
  - 延伸追问1
---

# 什么是 Transformer 的自注意力机制？

（这里是 answer 正文，markdown，复用 react-markdown 渲染）
```

**字段映射规则**：
- frontmatter 存所有结构化字段。
- `question` 作为 body 一级标题 `# ...`（标题之后的内容即 answer）。
- `answer` = body 中去掉首个 `# 标题行` 后的正文。
- 空字段（images 空、无 feynman/first_principle）frontmatter 中省略，解析时按缺失处理。
- **跨分类**：`categories` 数组（可选）。单分类题省略，默认等于 `category`。

## 6. 目录结构

```
ai-interview/                         （改造为 Next.js 项目根）
  questions/                          ← 唯一真理源（按 category 分文件夹）
    llm-core/    llm-001.md ...
    ai-agent/    ...
    ai-harness/  fde/  eng-practice/  ai-basics/  ai-scenario/
  public/
    images/                           ← 复用现有图片（171 张）
    manifest.json
  src/
    app/
      layout.tsx                      ← 根布局（主题、PWA、全局状态 Provider）
      page.tsx                        ← 首页（分类+列表+筛选+搜索+仪表盘）
      question/[id]/page.tsx          ← 题目详情页（静态生成，generateStaticParams）
    components/
      CategoryTabs.tsx  CardGrid.tsx  QuestionCard.tsx
      FilterBar.tsx                   ← 难度/子分类/标签云
      SearchBar.tsx
      QuestionModal.tsx               ← 列表内弹窗（与详情页共享内容组件）
      QuestionContent.tsx             ← 费曼/FP/答案/配图/追问（弹窗与详情页共用）
      FeynmanCard.tsx  FirstPrincipleCard.tsx
      StudyMode.tsx  ReviewMode.tsx
      SettingsPanel.tsx  ShortcutsHelp.tsx  Toast.tsx
      ProgressRing.tsx  DifficultyBars.tsx
      StudyDashboard.tsx  ReviewDashboard.tsx
    lib/
      questions.ts                    ← 构建时读 questions/**/*.md → 题目数据
      markdown.ts                     ← gray-matter 解析
      algorithms.ts                   ← SM-2/Leitner/Ebbinghaus 三算法（纯函数）
      store.ts                        ← Zustand store（收藏/笔记/评分/复习/主题/排序）
      storage.ts                      ← localStorage 封装（兼容现有 key）
      config.ts                       ← 从 config.js 迁移的 APP_CONFIG
      shortcuts.ts                    ← 快捷键映射
  scripts/
    migrate_to_md.py                  ← 一次性：原 data/*.json → questions/**/*.md
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

## 7. 功能保真映射（全量保留，不丢功能）

下列现有功能全部迁移。来源：app.js(28) + study.js + forgetting.js。

### 7.1 首页 / 列表
- 分类 tab（计数徽标）
- 难度筛选（L1–L5）
- 难度分布条（当前筛选集相对柱状）
- 子分类分组筛选（raw→group 映射，复用 subcatGroups）
- 标签云多选（Top 20，AND 逻辑）
- 收藏（卡片心形按钮 + "仅看收藏"开关）
- 全文搜索（question + tags + subcategory + answer）
- 搜索历史（焦点下拉、最近 8 条、清空）
- 排序三档（由浅入深 / 由深入浅 / 默认）
- 虚拟滚动分页（PAGE_SIZE=48，IntersectionObserver）
- 随机一题（快捷键 L）
- 进度环 / 已看徽标 / 已掌握/待复习徽标

### 7.2 题目详情（弹窗 + 详情页共享内容）
- 费曼卡（本质/类比/记忆要点）
- 第一性原理卡（问题/公理/重建）
- markdown 答案（react-markdown）
- 配图（首图 eager 其余 lazy，点击全屏）
- 延伸追问（点击智能跳转相关题）
- 收藏 / 复制答案 / 分享深链 / 报错（开 GitHub Issue）
- 上下题导航（←/→，位置指示）
- 滑动手势关闭（移动端）
- 个人笔记（自动保存）
- 深链（`#q=id` 与 `/question/[id]`）

> **点卡片行为**：与原站一致——点列表卡片**打开弹窗**（不跳路由，避免打断浏览、保留筛选状态）。
> 弹窗与 `/question/[id]` 详情页**共享 `QuestionContent` 组件**（费曼/FP/答案/配图/追问/笔记）。
> `/question/[id]` 详情页用于：分享生成的可直达 URL、SEO/社交预览、深链 `#q=id` 的服务端命中。
> 弹窗打开时同步更新 URL hash 为 `#q=<id>`（可复制分享）；深链 `#q=<id>` 命中时优先开弹窗。

### 7.3 学习模式（study）
- 三模式：顺序 / 随机 / 错题本
- 三档评分：会了(know) / 模糊(fuzzy) / 不会(dont)
- 每日目标 + 连续天数 streak + 打卡
- 完成统计（总数/掌握率/等级 emoji）

### 7.4 遗忘曲线复习（forgetting）
- **三算法**（纯函数实现，数值与原实现对照验证）：
  - **SM-2**：ease 初值 2.5、下限 1.3；quality 映射 [1,3,4,5]；失败重置 1 天；通过按 SM-2 公式调整 ease，reps 0→1 天 / reps 1→3 天 / 否则 round(interval*ease)。
  - **Leitner**：box 0–4，间隔 [1,3,7,14,30]；失败 box-1，通过 box+1。
  - **Ebbinghaus**：phase 0–5，间隔 [1,2,4,7,15,30]；失败 phase=0，通过 phase+1。
  - 共享：±10% fuzz（interval>1）、lapses、history（最近 20）、nextDate。
- 四档评分（忘了/模糊/记住/轻松 → quality 0/1/2/3），每按钮显示间隔预览。
- 到期队列（按 nextDate 升序、lapses 降序）、每日限额（5–500）。
- 7 日预报柱状图、掌握判定（leitner box≥4 / ebbinghaus phase≥5 / sm2 interval≥21）。
- 通知开关、自动注册开关、算法切换（迁移已有 item.algo）、重置。

### 7.5 全局
- 暗色模式（`data-theme`，持久化）
- 快捷键面板（**补齐**现有缺失的 1–6/F/D/S 快捷键）
- Toast 通知
- 设置面板
- 导出：进度报告 / 错题本 / 笔记（**修复** `exportProgress` 命名冲突，合并为统一导出含复习数据）
- PWA 离线（Service Worker 缓存静态资源）
- 移动端适配（安全区、44px 触控、滑动手势）

### 7.6 顺带修复的现有问题
- `exportProgress` 在 app.js 与 study.js 重名冲突 → 合并为一个完整导出。
- `escapeAttr` 不完整（未转义 `<>&`）→ React 自动转义解决。
- 快捷键面板宣传但未实现的 `1–6`/`F`/`D`/`S` → 补齐实现。
- 深链重试轮询（25×200ms）→ 改为 Next.js 静态页直接命中，无需轮询。

## 8. localStorage 兼容（用户数据零丢失）

Zustand persist 配置读取**现有** key，格式不变：

| key | 值 |
|-----|----|
| `ai-interview.favorites` | id 数组 |
| `ai-interview.viewed` | id 数组 |
| `ai-interview.notes` | `{id: text}` |
| `ai-interview.ratings` | `{id: 'know'\|'fuzzy'\|'dont'}` |
| `ai-interview.theme` | `'light'\|'dark'` |
| `ai-interview.sortOrder` | `'easy-first'\|'hard-first'\|'default'` |
| `ai-interview.searchHistory` | 字符串数组（最近 8） |
| `ai-interview.dailyLog` | `{date:{studied,know,fuzzy,dont}}` |
| `ai-interview.lastStudyDate` | `YYYY-MM-DD` |
| `ai-interview.streak` | 数字 |
| `ai-interview.dailyGoal` | 数字（默认 20） |
| `ai-interview.reviewData` | `{id: reviewItem}` |
| `ai-interview.reviewAlgorithm` | `'sm2'\|'leitner'\|'ebbinghaus'` |
| `ai-interview.dailyReviewLimit` | 数字（默认 50） |
| `ai-interview.reviewNotification` | `'true'\|'false'` |
| `ai-interview.autoEnroll` | `'true'\|'false'` |

## 9. 迁移脚本（scripts/migrate_to_md.py）

一次性脚本，从原 `data/*.json` 生成 `questions/**/*.md`：

1. 读取 `config.js` 的 categories（files 映射）。
2. 确定每题主分类：按 categories 顺序，题首次出现的 category 为主分类（.md 放置目录）。
3. 跨分类：同一 id 只写一次 .md；frontmatter `categories` 写全所有归属分类。
4. 写 `questions/<category>/<id>.md`（frontmatter + `# question` + answer body）。
5. 校验：生成后题目数 = 911；每分类计数与原数据一致；无 frontmatter 解析失败。
6. 迁移完成后按用户决定处理原 JSON（本次：直接删除原 data/*.json）。

脚本幂等：重复运行覆盖生成相同结果。

## 10. 测试 5 轮（验收）

环境：`cd ai-interview && npm run build && npm run preview`（或 `next dev` 开发态）。

| 轮次 | 验证内容 | 通过标准 |
|------|---------|---------|
| **R1 数据完整** | `next build` 成功；题目数=911；各分类计数正确；`/question/[id]` 全部静态生成 | build 无错，generateStaticParams 产出 911 页 |
| **R2 核心功能** | 首页/分类/难度/子分类/标签云/搜索/排序/虚拟滚动；详情（费曼+FP+答案+配图+追问+笔记+收藏+复制+分享+报错） | 功能不报错，答案完整渲染，搜索命中答案关键词 |
| **R3 学习+复习** | study 三模式/评分/streak；review 三算法/四档评分/到期队列/7日预报/掌握判定/限额 | 算法计算与原实现数值对照一致 |
| **R4 数据兼容+导出** | 老用户 localStorage 能读出收藏/笔记/复习进度；进度/错题本/笔记导出格式正确 | 无数据丢失，导出可用 |
| **R5 PWA+移动端** | SW 离线可浏览；移动端布局/手势/安全区；深链直达；快捷键全（含补齐的） | 离线可用，移动端正常 |

每轮发现问题即修复并重跑。全部通过即视为改造完成。验收记录写入本 spec 同目录的测试报告。

## 11. 范围与非目标

- **本次只改 `ai-interview`**。`java-interview` 待此方案验证后同法复制（其数据更规整、无跨分类重复，更简单）。
- `interview-framework/` 不再使用（新项目自成一体），但保留不删（java-interview 仍依赖它）。
- 不做后端、不做数据库、不做用户账号。所有数据继续存浏览器 localStorage。
- 不改变题目内容本身（迁移是格式转换，不改写答案文字）。
