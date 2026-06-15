# 🧠 AI 面试题库 · 150 题精讲

> AI / AI Agent / AI Harness 三大方向，150 道精选面试题
> 对标 **阿里 P7 / 字节 2-2 / 腾讯 T9**

## ✨ 特性

- 📚 **150 道精选题目** — AI 基础 50 + AI Agent 50 + AI Harness 50
- 🔍 **智能搜索** — 题目、标签、答案全文搜索
- 🏷️ **多维筛选** — 分类 / 难度(L1-L5) / 子分类
- 💝 **收藏功能** — 一键收藏，只看收藏
- 📊 **进度跟踪** — 学习进度环 + 统计仪表盘
- 📱 **PWA 支持** — 离线访问，可安装到桌面
- 🌙 **深色模式** — 自动跟随系统，手动切换
- 📖 **详细答案** — Markdown 渲染，支持表格/代码/列表
- ❓ **延伸追问** — 每题附带 2-3 个深入追问
- ⚡ **纯前端** — 零依赖，数据展示分离架构

## 📂 项目结构

```
ai-interview/
├── index.html              # HTML 展示层
├── css/
│   └── style.css           # Apple 风格样式
├── js/
│   └── app.js              # 逻辑层（渲染/搜索/筛选/模态）
├── data/                   # 数据层（JSON）
│   ├── ai-basics.json      # 50 题：大模型原理/训练微调/推理优化/RAG/Prompt/多模态/评估安全
│   ├── ai-agent.json       # 50 题：Agent架构/工具使用/记忆系统/规划推理/多Agent/评估/生产化
│   └── ai-harness.json     # 50 题：LLM框架/RAG工程化/向量数据库/模型服务/Agent框架/可观测/工程实践
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
└── README.md
```

## 🎯 知识体系

### AI 基础 (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| 大模型原理 | Attention, MoE, RoPE, KV Cache, 位置编码, RMSNorm |
| 训练与微调 | LoRA, RLHF, DPO, PPO, 数据配比, 消融实验 |
| 推理优化 | vLLM, 量化, Speculative Decoding, KV Cache |
| RAG 与向量检索 | 分块策略, 混合检索, Reranker, GraphRAG |
| Prompt Engineering | CoT, ICL, 结构化输出, Prompt 注入防御 |
| 多模态 | CLIP, LLaVA, 扩散模型 |
| 评估与安全 | Benchmark, 幻觉, 红队测试, Constitutional AI |

### AI Agent (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| Agent 架构 | ReAct, Plan-and-Execute, AutoGPT, Devin, Claude Code, Manus |
| 工具使用 | Function Calling, MCP, 工具选择, A2A, 沙箱, 错误恢复 |
| 记忆系统 | 短期/长期记忆, Context Compaction, MemGPT |
| 规划与推理 | ToT, Reflection, MCTS, 任务分解 |
| 多 Agent 系统 | AutoGen, CrewAI, Swarm, 辩论, 涌现行为 |
| Agent 评估 | SWE-Bench, GAIA, WebArena, 成本分析 |
| 生产化部署 | 并发, 可观测性, 限流, 模型路由, Human-in-Loop |

### AI Harness (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| LLM 框架 | LangChain, LlamaIndex, DSPy, Haystack, Outlines, Vercel AI SDK |
| RAG 工程化 | 高级分块, 查询扩展, 多模态 RAG, Agentic RAG, CRAG |
| 向量数据库 | Pinecone/Milvus/Qdrant, HNSW, PQ/SQ 量化 |
| 模型服务 | vLLM, SGLang, Ollama, GGUF/AWQ, PagedAttention |
| Agent 框架 | LangGraph, CrewAI, AutoGen, Dify, Mastra |
| 可观测性 | LangSmith, Phoenix, Prompt 版本管理 |
| 工程实践 | 成本优化, CI/CD, A/B 测试, 高可用, 多租户 |

## 🚀 使用

```bash
# 本地启动
python3 -m http.server 8090

# 访问
open http://localhost:8090
```

## 🧪 测试

30 项 Playwright 自动化测试全部通过：
- ✅ 页面加载 & 数据加载（150 题）
- ✅ 分类/难度/子分类筛选
- ✅ 全文搜索
- ✅ 模态详情（答案/追问/Markdown）
- ✅ 收藏 & 只看收藏
- ✅ 进度环 & 统计
- ✅ 深色模式切换
- ✅ 键盘快捷键
- ✅ 0 JS 错误

## 📐 架构：数据展示分离

```
数据层 (JSON)  →  逻辑层 (JS)  →  展示层 (HTML/CSS)
data/*.json       js/app.js       index.html + css/style.css
```

数据修改只需编辑 JSON 文件，无需改动代码。

## 📄 License

MIT
