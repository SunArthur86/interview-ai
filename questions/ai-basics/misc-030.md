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
| **数据结构** | 独立的文本块 | 实体关系图 (图谱) | 文本块 + 标签/字段 |
| **全局理解能力** | 弱 (依赖Top-K拼接) | **强** (基于社区摘要) | 弱 |
| **多跳推理** | 差 (语义断裂) | **优** (显式路径) | 差 |
| **构建成本** | 低 | **极高** (需图谱构建+LLM抽取) | 低 |
| **可解释性** | 低 (黑盒向量) | 高 (结构化路径) | 中 |
| **适用问题类型** | 事实查询、具体问题 | 宏观总结、复杂推理 | 带有明确筛选条件的查询 |

## 常见考点
1. **GraphRAG 和单纯的 Knowledge Graph RAG (如 Neo4j) 有什么区别？**
   - GraphRAG 特指微软提出的利用 LLM 进行图谱构建和社区摘要的流程，核心在于「社区摘要」的预计算，以解决全局性问题的回答；传统 KG RAG 更多侧重于利用显式结构做精确查询。

2. **Leiden 算法的作用是什么？**
   - 用于图谱的社区发现，将密集连接的节点聚类成社区。这允许系统在检索时直接利用社区级别的摘要，而不是遍历海量节点，大幅提升全局查询的效率。

3. **GraphRAG 最适合解决什么痛点？**
   - 解决传统 RAG 在处理「全局性问题」（如「这批数据主要讲了哪些主题？」）时的碎片化问题，以及需要跨文档进行多跳推理的场景。
