---
id: sarg-005
difficulty: L3
category: ai-agent
subcategory: RAG技术
images:
- svg_rag.svg
feynman:
  essence: 通过优化查询、检索策略和上下文利用来提升RAG效果。
  analogy: 从简单的“关键词匹配”进化到“专家查阅资料并推理”。
  first_principle: 如何让检索增强生成系统处理复杂查询并减少幻觉？
  key_points:
  - 查询重写与多路召回
  - 图谱与自省机制
  - 长短上下文自适应策略
---

# RAG有哪些进阶技术？

基础 RAG 的进阶技术主要围绕“优化 Query”、“优化检索策略”和“优化生成逻辑”展开。

### 1. 查询优化
*   **Query Rewriting (查询重写)**：利用 LLM 将用户模糊、简短的口语化问题改写为清晰、适合检索的形式（补充缺失实体、修正错别字）。
*   **HyDE (Hypothetical Document Embeddings)**：
    *   **原理**：先让 LLM 针对问题生成一个“假设性答案”，然后对这个答案进行 Embedding 检索。
    *   **作用**：将 Query-to-Doc 的匹配转化为 Doc-to-Doc 的匹配，往往比直接用问题检索语义更相关。
*   **Multi-Query (多路查询)**：
    *   **原理**：LLM 生成多个不同角度的问题（如“技术原理”、“应用场景”），并行检索后合并去重。
    *   **作用**：解决语义覆盖不全的问题。

### 2. 检索优化
*   **GraphRAG (知识图谱 RAG)**：
    *   **原理**：从文档中提取实体和关系构建图谱。检索时不仅检索文本，还通过图遍历找到关联节点（多跳查询）。
    *   **优势**：擅长处理跨文档的全局性问题（如“项目A和项目B的关系”）。
*   **混合检索 + Rerank**：结合 BM25（关键词）和 Vector（语义），用 Rerank 模型融合排序。

### 3. 生成与逻辑优化
*   **Self-RAG**：
    *   **原理**：在 LLM 训练时引入“反思 Token”，如 `Retrieve` (需要检索)、`Rel` (相关)、`Sup` (支持)。模型在生成时能自我判断：是否需要检索？检索到的东西是否有用？
    *   **流程**：`问题 --> [模型判断需检索] --> 检索 --> [模型判断文档相关] --> 生成答案`。
*   **Adaptive RAG (自适应 RAG)**：根据问题的复杂程度路由到不同的处理链路。简单问题直接答，复杂问题走 RAG，模糊问题走 Web Search。
*   **Long Context RAG**：利用支持 128k-1M 上下文的模型（如 GPT-4-turbo, Claude 3），将大量文档直接塞入 Context Window，省去复杂的检索步骤，适合对精确性要求不高但需全景视角的任务。

### 实战深化

**1. 实战案例**：在处理多轮对话的 RAG 系统时，用户追问“那个多少钱”，直连向量库会检索失败。使用 **Query Rewriting** 结合历史记录，将其重写为“[产品A] 的价格是多少”，检索准确率提升 40% 以上。

**2. 代码示例**：
```python
# Multi-Query 并行检索示例
from langchainhub import prompthub
from langchain.output_parsers import PydanticOutputParser

# 1. 让 LLM 生成多角度的查询
prompt = hub.pull("rlm/multi-query-retriever")
queries = llm.invoke(prompt.format(question=user_question))

# 2. 并行检索并去重
unique_docs = set()
for q in queries.split("\n"):
    docs = vectorstore.similarity_search(q)
    unique_docs.update(docs)

# 3. 将所有去重后的上下文给 LLM
```

**3. 进阶技术选型对比**：

| 技术 | 核心痛点 | 适用场景 | 实现成本 | Token 消耗 |
| :--- | :--- | :--- | :--- | :--- |
| **HyDE** | Query 与 Doc 语义鸿沟 | 领域知识专业、Doc 风格独特的场景 | 低 (需一次 LLM 调用) | 中 (生成假设答案) |
| **Multi-Query** | Query 表达单一、语义歧义 | 开放式问答、探索性搜索 | 中 (需多次向量检索) | 低 (仅检索) |
| **GraphRAG** | 跨文档关联、全局总结 | 复杂知识库、实体关系密集 | 高 (需构建图谱) | 低 (检索精准) |
| **Long Context** | 检索割裂上下文、丢失细节 | 全文总结、小规模文档集 | 低 (长窗口模型) | 高 (全量输入) |

### 边界情况与极端场景
1.  **Multi-Query 的噪声放大**：若原始 Query 有错误前提（如“地球是平的为什么...”），Multi-Query 可能会生成多个基于错误前提的子问题，导致检索结果全是噪声。需配合 Query Rewrite 纠错机制。
2.  **HyDE 的幻觉陷阱**：对于冷门或虚构问题，LLM 生成的假设答案可能完全胡编乱造（幻觉），导致检索到相似度极高但完全错误的内容。此时应回退到关键词检索。
3.  **GraphRAG 的图遍历爆炸**：在超大规模图谱中进行多跳查询可能引发性能问题，需限制最大跳数或引入剪枝策略。

## 易错点
1.  **Long Context 的迷失中间现象**：即使模型支持 1M 上下文，关键信息若放在 Context 中间位置，模型往往难以准确提取（Lost-in-the-Middle 现象），不能迷信“全量塞进去”优于“精准检索”。
2.  **盲目堆叠技术**：同时开启 HyDE + Multi-Query + Rerank 可能导致延迟过高且收益递减，应根据具体 Bad Case 进行针对性优化。

## 面试追问
1.  HyDE 在生成假设答案时产生了幻觉，导致检索到错误文档，如何从系统层面检测并规避这种风险？
2.  GraphRAG 需要预先构建图谱，对于每天更新的海量新闻类数据，如何设计增量更新的图谱构建流程以保证实时性？
3.  Self-RAG 需要训练带有 Reflection Token 的模型，如果只有现有黑盒 API（如 GPT-4），如何模拟实现类似 Self-RAG 的“检索-评估-生成”循环？

