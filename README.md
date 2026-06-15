# 🧠 AI 面试题库 · 576 题精讲

> AI 基础 / AI Agent / AI Harness / LLM面试100问 / AI Agent面试全攻略
> 576 道精选面试题，对标 **阿里 P7 / 字节 2-2 / 腾讯 T9**

## ✨ 特性

- 📚 **576 道精选题目** — 15 大分类，全面覆盖 AI Agent 面试知识体系
- 🔍 **智能搜索** — 题目、标签、答案全文搜索
- 🏷️ **多维筛选** — 分类 / 难度(L1-L5) / 子分类
- 💝 **收藏功能** — 一键收藏，只看收藏
- 📊 **进度跟踪** — 学习进度环 + 统计仪表盘
- 📱 **PWA 支持** — 离线访问，可安装到桌面
- 🌙 **深色模式** — 自动跟随系统，手动切换
- 📖 **详细答案** — Markdown 渲染，支持表格/代码/列表
- ❓ **延伸追问** — 部分题目附带深入追问
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
│   ├── ai-basics.json          # 50 题：大模型原理/训练微调/推理优化/RAG/Prompt/多模态/评估安全
│   ├── ai-agent.json           # 50 题：Agent架构/工具使用/记忆系统/规划推理/多Agent/评估/生产化
│   ├── ai-harness.json         # 50 题：LLM框架/RAG工程化/向量数据库/模型服务/Agent框架/可观测/工程实践
│   ├── llm-100.json            # 107 题：Transformer/LoRA/RLHF/DPO/PPO/手撕代码/DeepSeek-R1等
│   ├── agent-concept.json      # 27 题：AI Agent 基础概念（定义/架构/组件/工作流程）
│   ├── agent-framework.json    # 27 题：ReAct/Plan-and-Execute/Reflexion/LATS/LangChain/LangGraph
│   ├── agent-rag.json          # 24 题：分块策略/向量数据库/混合检索/重排序/GraphRAG/Agentic RAG
│   ├── agent-tools.json        # 25 题：Function Calling/MCP协议/工具路由/安全/权限控制
│   ├── agent-memory.json       # 20 题：短期/长期记忆/摘要压缩/记忆检索/MemGPT/记忆图谱
│   ├── agent-multi.json        # 20 题：协作模式/AutoGen/CrewAI/MetaGPT/任务分配/评估
│   ├── agent-llm.json          # 28 题：Transformer/注意力机制/训练微调/推理优化/量化/分布式
│   ├── agent-eng.json          # 29 题：模型路由/熔断器/缓存/Trace/安全/金丝雀发布/K8s
│   ├── agent-prompt.json       # 27 题：CoT/Few-shot/结构化输出/Prompt注入/DSPy/版本管理
│   └── agent-interview-qa.json # 92 题：架构设计/技术实现/性能优化/故障处理/工程质量/业务理解（STAR格式）
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
└── README.md
```

## 🎯 知识体系

### 原有题库（257 题）

#### AI 基础 (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| 大模型原理 | Attention, MoE, RoPE, KV Cache, 位置编码, RMSNorm |
| 训练与微调 | LoRA, RLHF, DPO, PPO, 数据配比, 消融实验 |
| 推理优化 | vLLM, 量化, Speculative Decoding, KV Cache |
| RAG 与向量检索 | 分块策略, 混合检索, Reranker, GraphRAG |
| Prompt Engineering | CoT, ICL, 结构化输出, Prompt 注入防御 |
| 多模态 | CLIP, LLaVA, 扩散模型 |
| 评估与安全 | Benchmark, 幻觉, 红队测试, Constitutional AI |

#### AI Agent (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| Agent 架构 | ReAct, Plan-and-Execute, AutoGPT, Devin, Claude Code, Manus |
| 工具使用 | Function Calling, MCP, 工具选择, A2A, 沙箱, 错误恢复 |
| 记忆系统 | 短期/长期记忆, Context Compaction, MemGPT |
| 规划与推理 | ToT, Reflection, MCTS, 任务分解 |
| 多 Agent 系统 | AutoGen, CrewAI, Swarm, 辩论, 涌现行为 |
| Agent 评估 | SWE-Bench, GAIA, WebArena, 成本分析 |
| 生产化部署 | 并发, 可观测性, 限流, 模型路由, Human-in-Loop |

#### AI Harness (50 题)
| 子分类 | 覆盖知识点 |
|--------|-----------|
| LLM 框架 | LangChain, LlamaIndex, DSPy, Haystack, Outlines, Vercel AI SDK |
| RAG 工程化 | 高级分块, 查询扩展, 多模态 RAG, Agentic RAG, CRAG |
| 向量数据库 | Pinecone/Milvus/Qdrant, HNSW, PQ/SQ 量化 |
| 模型服务 | vLLM, SGLang, Ollama, GGUF/AWQ, PagedAttention |
| Agent 框架 | LangGraph, CrewAI, AutoGen, Dify, Mastra |
| 可观测性 | LangSmith, Phoenix, Prompt 版本管理 |
| 工程实践 | 成本优化, CI/CD, A/B 测试, 高可用, 多租户 |

#### LLM 面试100问 (107 题) 🔥
> 来源：小黄搞AI《大模型面试100问》PDF，涵盖大模型面试高频考点

### AI Agent 面试全攻略（319 题）📘
> 来源：《AI Agent 面试全攻略 — 从零到 Offer》PDF（2026年4月版），覆盖 9 大模块 + 企业面试问答

#### Agent 基础概念 (27 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| Agent 定义 | LLM + Planning + Memory + Tools 的闭环系统 |
| Agent vs ChatBot vs Chain | 控制流差异、自主决策能力 |
| 核心组成 | 感知-思考-行动循环、停止条件 |
| Agent 分类 | 效用型/目标型/反应式 Agent |

#### 核心框架 (27 题)
| 框架 | 覆盖内容 |
|------|---------|
| ReAct | Thought-Action-Observation 循环、CoT 对比 |
| Plan-and-Execute | 全局规划、Re-planning、计划抖动 |
| Reflexion | 自我反思、关键产出、迭代提升 |
| LATS | 树搜索 Agent、成本收益分析 |
| LangChain | AgentExecutor、max_iterations |
| LangGraph | 状态图、条件边、多 Agent 编排 |

#### RAG 技术 (24 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| 分块策略 | chunk_overlap、语义分块、父子文档 |
| 向量检索 | Embedding 归一化、FAISS、HNSW |
| 混合检索 | BM25+向量、RRF 融合、权重调优 |
| 高级 RAG | HyDE、GraphRAG、Agentic RAG、Self-RAG、Corrective RAG |
| 评估 | RAGAS、在线评估、索引一致性 |

#### 工具调用 (25 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| Function Calling | JSON Schema、tool_calls、OpenAI 兼容接口 |
| MCP 协议 | 痛点解决、与 Function Calling 关系 |
| 工具路由 | 向量路由、并行调用、依赖 DAG |
| 安全 | 两阶段提交、权限控制、代码执行沙箱 |

#### 记忆系统 (20 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| 记忆模型 | 人类记忆类比、短期/长期/感觉记忆 |
| 缓冲策略 | Buffer/Window、Token 预算分配 |
| 向量记忆 | 向量数据库存储、衰减策略、脏数据防护 |
| 摘要压缩 | 增量摘要、误差累积缓解 |
| 高级记忆 | MemGPT、记忆图谱、多 Agent 共享记忆 |

#### 多智能体系统 (20 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| 协作模式 | Boss-Worker、Pipeline、民主讨论、黑板模式 |
| 框架对比 | AutoGen vs LangGraph vs CrewAI vs MetaGPT |
| 系统设计 | 状态机、容错、错误隔离、死循环检测 |
| 评估 | 多 Agent 评估、人机在环、一致性保证 |

#### 大模型基础 (28 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| Transformer | Self-Attention 公式、多头注意力、RoPE、Flash Attention |
| 训练微调 | LoRA/QLoRA、SFT、RLHF、DPO、PPO |
| 推理优化 | KV Cache、Prefill/Decode、PagedAttention、投机解码 |
| 量化部署 | INT4、GPTQ、张量并行、流水线并行、MoE |

#### 工程化实践 (29 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| 模型路由 | 多模型网关、三态熔断器、自动降级 |
| 可观测性 | Trace、结构化日志、OpenTelemetry Span |
| 安全 | Prompt 注入、越狱、工具调用授权 |
| 部署 | 金丝雀发布、蓝绿部署、K8s HPA |
| 评估 | LLM 评测、回归测试、幻觉排查 |

#### Prompt 工程 (27 题)
| 知识点 | 覆盖内容 |
|--------|---------|
| 核心技术 | CoT、Few-shot、Self-Consistency、结构化输出 |
| Agent Prompt | ReAct vs Plan-and-Execute 选择、工具描述 |
| 高级主题 | DSPy 优化、版本管理、多语言 Prompt |
| 安全 | 间接注入防御、Few-shot 隐私泄露 |

#### 企业面试问答 (92 题) 💼
> 全部采用 STAR 格式（Situation-Task-Action-Result），基于真实项目经验

| 分类 | 题数 | 覆盖内容 |
|------|------|---------|
| 架构设计 | 18 | ReAct 选型、多路检索、编排器设计、可扩展性 |
| 技术实现 | 18 | 向量选型、ReAct Prompt、熔断器、记忆系统、重排序 |
| 性能优化 | 12 | Token 成本、延迟、缓存、流式输出、异步并行 |
| 故障处理 | 12 | 死循环、幻觉、超时、检索不准、工具失败 |
| 工程质量 | 12 | 测试覆盖、监控告警、CI/CD、安全、代码质量 |
| 业务理解 | 8 | 业务价值、用户反馈、竞品对比、技术规划 |
| 基础知识 | 12 | Transformer、LoRA、RAG vs 微调、KV Cache、MoE |

## 🚀 使用

```bash
# 本地启动
python3 -m http.server 8090

# 访问
open http://localhost:8090
```

## 🧪 测试

Playwright 自动化测试：
- ✅ 页面加载 & 数据加载（576 题）
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
