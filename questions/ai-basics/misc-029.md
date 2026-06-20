---
id: misc-029
difficulty: L2
category: ai-basics
subcategory: RAG与向量检索
tags:
- IOC
feynman:
  essence: 把模糊的用户提问转化为高质量、多样化的检索指令。
  analogy: 像去饭店点菜，把“随便来点好吃的”翻译成具体的“宫保鸡丁和鱼香肉丝”，厨师（检索系统）才好做。
  first_principle: 如何解决用户提问模糊、信息不全，导致检索系统找不到正确文档的问题？
  key_points:
  - HyDE生成假答案去反搜，语义更准
  - Step-Back Prompting先查背景再回答细节
  - Multi-Query多路召回防止遗漏
follow_up:
- HyDE在什么场景下效果最好?
- Multi-Query会增加多少延迟?
---

# RAG中的查询改写技术有哪些?HyDE和Step-Back Prompting分别解决什么问题

- **查询改写技术:**

- **1. Query Rewriting(查询改写):**
- 用LLM将用户模糊问题改写为更精确的检索查询
- 例:「怎么用那个东西」→「如何使用React Hooks」

- **2. HyDE (Hypothetical Document Embeddings):**
- 先让LLM生成一个假想答案
- 用假想答案的embedding去检索(而不是用原问题)
- 原理:答案比问题更接近目标文档的语义
- 效果:对于事实型问题检索质量大幅提升

- **3. Step-Back Prompting:**
- 将具体问题抽象为更宽泛的问题
- 例:「Google 2024 Q4收入」→「Google最近4个季度收入趋势」
- 先检索背景知识,再回答具体问题

- **4. Multi-Query:**
- 用LLM生成同一问题的多个变体
- 分别检索后取并集+去重+重排

- **架构对比:**

```text
Original Query: "iPhone 15 Pro Max 电池续航怎么样?"

┌─────────────────────────────────────────────────────┐
│ Strategy 1: HyDE                                     │
├─────────────────────────────────────────────────────┤
│ 1. LLM Gen: "根据测试,iPhone 15 Pro Max续航达29小时..."│
│ 2. Vector Search: [Fake Answer Embedding]            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Strategy 2: Multi-Query                              │
├─────────────────────────────────────────────────────┤
│ Gen Queries:                                         │
│ 1. "苹果15 Pro Max 电池测试数据"                      │
│ 2. "iPhone 15 Pro Max battery life review"          │
│ 3. "iPhone 15 PM 续航评测"                            │
│ -> Search All -> Merge -> Rerank                     │
└─────────────────────────────────────────────────────┘
```

- **实战案例:** 在金融RAG系统中，用户提问“最近美联储加息对房贷的影响”。直接检索容易召回零散新闻。使用HyDE生成包含“利率上升、按揭成本增加、房地产市场降温”等关键词的假设性回答后，向量检索召回了深度分析报告，相关性显著提升。

- **代码示例:**
```python
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# HyDE 实现逻辑
def hyde_retrieval(query, llm, vector_store):
    # 1. 生成假设文档
    prompt = PromptTemplate.from_template(
        "Please write a passage to answer the question: {question}"
    )
    hyde_prompt = prompt.format(question=query)
    fake_doc = llm.predict(hyde_prompt) # LLM生成
    
    # 2. 使用假设文档进行检索
    docs = vector_store.similarity_search(fake_doc, k=5)
    return docs
```

- **对比表格:**

| 技术方案 | 核心思路 | 适用场景 | 缺点/成本 |
| :--- | :--- | :--- | :--- |
| **Query Rewriting** | 修正模糊/错误的表达 | 用户意图不清、指代消解 | 依赖LLM理解能力，可能过度改写 |
| **HyDE** | 用“答案”搜“答案” | 语义相似度高、事实性查询 | LLM幻觉导致检索偏差；延迟增加 |
| **Step-Back** | 抽象化/概念化 | 需要推理背景的复杂问题 | 对简单问题可能过度抽象，引入噪音 |
| **Multi-Query** | 覆盖多维度语义 | 主题发散、多义词查询 | 召回量大，需配合强Reranker；成本高 |

## 常见考点
1. **HyDE的局限性是什么？**
   - 如果LLM生成的假想答案包含事实错误或幻觉，可能会检索到错误的信息。此外，增加了额外的LLM推理延迟和成本。

2. **Step-Back Prompting 适合什么任务？**
   - 适合需要先验知识或背景概念的复杂推理任务（如物理、化学、历史分析），对于简单事实问答可能不仅无益甚至由于过度抽象降低准确率。

3. **Query Rewriting 和 Multi-Query 如何选择？**
   - Rewrite 适合意图模糊、指代不清的查询；Multi-Query 适合单一查询难以覆盖所有语义维度的场景（如多义词、中英混合）。
