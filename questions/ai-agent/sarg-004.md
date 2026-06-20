---
id: sarg-004
difficulty: L2
category: ai-agent
subcategory: RAG技术
images:
- svg_rag.svg
feynman:
  essence: 用精排模型对粗排结果进行二次筛选，提升准确率。
  analogy: 就像先用筛子快速筛沙，再人工挑出金子。
  first_principle: 如何在保证检索召回率的同时最大化结果的相关性？
  key_points:
  - 补全向量检索的信息损失
  - 牺牲速度换取精度
  - 流程：粗排召回 → 精排截断
---

# 什么是Reranking？为什么RAG需要它？

Rerank（重排序）是提升 RAG 精度性价比最高的手段之一。

### 原理与架构
```text
阶段1: 检索 - 追求高召回
User Query ──> Embedding Model ──> 向量库
                           ↓
                    Top-100 候选集
                           │
阶段2: 重排 - 追求高精度
             ┌──────────────┴──────────────┐
             │   Cross-Encoder (Reranker)  │ <── Query + Docs 拼接输入
             │    (交互计算相关性分数)      │
             └──────────────┬──────────────┘
                           ↓
                    Top-5 / Top-10
                           ↓
                    LLM Generation
```

### 为什么需要 Rerank
1.  **弥补向量检索的不足**：Embedding 是将复杂语义压缩成向量，存在信息损失。对于细微差别（如否定词、具体数量），向量检索往往不如字面匹配。
2.  **计算效率权衡**：
    *   向量检索：独立编码 Query 和 Doc，可预先计算 Doc 向量，速度极快，适合从海量数据中捞出 Top-100。
    *   Rerank：需将 Query 和每个 Doc 拼接输入模型进行交互，计算量大。仅对 Top-100 进行计算，耗时可控，但能显著提升 Top-5 的准确率。

### 核心模型对比
| 特性 | Bi-Encoder (检索) | Cross-Encoder (Rerank) |
| :--- | :--- | :--- |
| **输入** | Query 和 Doc 分别独立输入 | Query 和 Doc 拼接成 `[CLS] Query [SEP] Doc [SEP]` 一起输入 |
| **计算方式** | 计算两个向量的余弦相似度 | 模型深层交互 Attention 机制，直接输出 0-1 相关性分数 |
| **速度** | 极快 (毫秒级) | 慢 (与 Doc 数量成正比) |
| **精度** | 中等 | 高 (SOTA 水平) |

### 常用模型
*   **BAAI/bge-reranker-v2-m3**：支持多语言，轻量级。
*   **Cohere Rerank (API)**：效果极佳，商业可用，支持多语言。

### 实战深化

**1. 实战案例**：在客服问答场景中，用户问“如何退款”，向量库可能同时召回“退款流程”和“不支持退款说明”的片段。若“不支持退款”的向量距离更近（仅因为词频高），直接传给 LLM 会导致回答错误。接入 Reranker 后，模型能捕捉“退款流程”与意图的强匹配，将其排在首位，避免误导用户。

**2. 代码示例 (Python)**：
```python
from FlagEmbedding import FlagReranker
reranker = FlagReranker('BAAI/bge-reranker-v2-m3', use_fp16=True)

# 假设从向量库召回的 Top-K 候选文档
candidates = ["退款流程是点击右上角...", "本商品特殊不支持退款..."]
query = "怎么申请退款"

# 计算分数 (Cross-Encoder 需要两两输入)
pairs = [[query, doc] for doc in candidates]
scores = reranker.compute_score(pairs) 

# 根据分数重新排序后取 Top-1
sorted_docs = [doc for _, doc in sorted(zip(scores, candidates), reverse=True)]
```

## 常见考点
1.  **Rerank 会对 RAG 系统的延迟产生多大影响？**
    通常 Rerank 仅处理前 50-100 个文档，增加的延迟在几百毫秒级（取决于模型大小），相比 LLM 生成的时间（秒级）通常是可以接受的。
2.  **向量检索效果已经很差了，Rerank 能救回来吗？**
    不能。Rerank 只能从召回的集合中挑选最好的，如果相关信息根本没被召回，Rerank 也无能为力。它负责“锦上添花”，不负责“无中生有”。
3.  **除了提升准确度，Rerank 还有其他作用吗？**
    有的。Rerank 模型可以输出分数，我们可以设定阈值，低于阈值的 Context 不送给 LLM，从而过滤掉噪声，减少幻觉。
