---
id: misc-030
difficulty: L2
category: ai-basics
subcategory: RAG与向量检索
tags:
- IOC
feynman:
  essence: 利用知识图谱结构化信息，解决全局理解和复杂推理问题。
  analogy: 从零散的碎纸片（向量RAG）拼成了一张结构清晰的地图（GraphRAG），既能看局部也能看全貌。
  first_principle: 如何让RAG系统不仅回答局部事实，还能理解数据集的全局结构和潜在联系？
  key_points:
  - 构建实体关系图谱，进行社区归纳
  - Local Search查点，Global Search查面
  - 擅长多跳推理和全局综述
follow_up:
- GraphRAG的图谱构建成本如何控制?
- 社区检测算法如何选择?
---

# GraphRAG(微软提出)是什么?相比传统向量RAG有什么优势

- **GraphRAG核心思想:**

**传统RAG：** 文档→chunks→embedding→检索
**GraphRAG：** 文档→**知识图谱**→社区检测→多层级摘要→检索

- **构建流程:**
1. **实体抽取** - LLM从文档中抽取实体和关系
2. **图谱构建** - 构建实体-关系图
3. **社区检测** - Leiden算法将图划分为层级社区
4. **摘要生成** - 为每个社区生成摘要

- **两种检索模式:**
- **Local Search:** 从相关实体出发,检索邻域子图 → 适合具体问题
- **Global Search:** 遍历所有社区摘要 → 适合「整个数据集讲了什么」类全局问题

- **数据结构示意图:**

```text
Source Texts
      │
      ▼ (Entity/Relation Extraction)
┌───────────────────────────────────────┐
│         Knowledge Graph                │
│  (Entity A)──[Relation]──(Entity B)    │
│       │                       │        │
│       └──(Entity C)──(Entity D)        │
└───────────────────┬───────────────────┘
                    │ (Community Detection)
                    ▼
┌───────────────────────────────────────┐
│            Community 1                 │
│  Summary: "This section discusses..." │
└───────────────────────────────────────┘
```

- **优势:**
1. **多跳推理** - 图结构天然支持
2. **全局理解** - 社区摘要解决「整体洞察」类问题
3. **可溯源** - 答案可追溯到具体关系链

- **代价:** 图谱构建成本高(大量LLM调用)

- **实战案例:** 在分析某大型企业数百份内部政策文档时，传统RAG难以回答“公司关于数据安全的整体策略框架是什么”这类跨文档宏观问题。GraphRAG通过构建“政策-部门-合规要求”的知识图谱并生成社区摘要，成功整合了分散在各部门文档中的安全策略。

- **代码示例:**
```python
# 模拟 GraphRAG 的社区检测与索引构建 (使用 networkx)
import networkx as nx
from community import community_louvain

def build_graph_index(entities_relations):
    G = nx.Graph()
    for ent, rel in entities_relations:
        G.add_edge(ent['source'], ent['target'], relation=rel)
    
    # 社区检测 (类似 Leiden 算法)
    partition = community_louvain.best_partition(G)
    
    # 为每个社区生成摘要 (通常调用 LLM)
    community_summaries = {}
    for comm_id in set(partition.values()):
        nodes = [n for n in partition if partition[n] == comm_id]
        # summary = llm.generate(f"Summarize connections for: {nodes}")
        community_summaries[comm_id] = f"Summary of community {comm_id}..."
    
    return G, community_summaries
```

- **对比表格:**

| 特性 | 传统 Vector RAG | GraphRAG (Microsoft) | Vector RAG + Metadata Filter |
| :--- | :--- | :--- | :--- |
| **数据结构** | 独立的向量片段 | 实体关系网络 | 带标签的向量片段 |
| **检索方式** | 语义相似度匹配 | 图遍历 + 社区摘要 | 向量匹配 + 标签过滤 |
| **全局能力** | 弱 (依赖文档重叠度) | 强 (社区层级摘要) | 中 (需预先分组) |
| **多跳推理** | 差 (需多次检索) | 好 (图结构天然支持) | 差 |
| **构建成本** | 低 | 高 (需实体抽取+建图) | 低 |
| **更新维护** | 容易 (增量入库) | 困难 (需局部重算或全量更新) | 容易 |

- **## 易错点**
1. **实体抽取的覆盖率与准确性**：如果实体抽取阶段遗漏了关键节点或关系（例如将“阿里云”和“阿里巴巴”识别为两个无关联实体），图谱会产生断裂，导致后续检索失效。
2. **图谱的实时更新难题**：Vector RAG中新增文档只需Embedding入库，而GraphRAG中新增文档可能触发全图的社区结构变化，导致更新成本极高。不可假设GraphRAG能像向量库那样低成本实时更新。

- **## 面试追问**
1. 如果知识图谱中存在错误的关系（幻觉导致），如何修正？（需要设计图谱修正机制或人工反馈回路，单纯依靠重新抽取可能重复错误）
2. GraphRAG的“Global Search”在生成社区摘要时，如果社区过大（如几千个节点），摘要的质量如何保证？（Microsoft采用了分层摘要，先对小区间摘要，再对大区间摘要，防止信息丢失）
3. 在资源受限的情况下，能否只用图结构而不用LLM生成摘要？（可以使用基于图算法（如PageRank）提取关键实体和路径，但失去了自然语言描述的语义连贯性，适合结构化查询而非阅读理解）
