---
id: ai-scen-040
difficulty: L3
category: ai-scenario
subcategory: AI推荐与搜索
tags:
- AI搜索
- Perplexity
- RAG
- 引用溯源
- 多源检索
- Query理解
feynman:
  essence: 检索增强生成（RAG）+引用溯源，直接生成答案。
  analogy: 像助理帮你读完资料并标注出处，直接给你结论。
  first_principle: 如何从信息检索升级为知识合成与交付？
  key_points:
  - Query分解与多源检索
  - 内容提取与去重
  - 引用标注抑制幻觉
  - 时效性与多源交叉验证
follow_up:
- AI搜索引擎的时效性如何保证？
- 引用溯源的准确性如何验证？
- 如何处理搜索结果中的信息冲突？
---

# 如何设计一个AI搜索引擎（类似Perplexity）？直接给出答案而非链接列表，支持引用溯源。

【场景分析】
AI搜索引擎（如Perplexity）= 传统搜索 + LLM理解 + RAG + 引用溯源。核心价值：直接给出答案而非链接列表，解决信息过载。

【系统架构】
1. **Query理解层**：
   - **意图识别**：分类为导航型（去哪）、信息型（是什么）、交易型（买什么）。
   - **Query改写与分解**：
     - 利用LLM将复杂Query拆解为多个Sub-Query（例如："比较iPhone 15和华为Mate 60" -> 拆解为："iPhone 15 参数"、"Mate 60 参数"、"两者对比评测"）。
     - 利用HyDE（Hypothetical Document Embeddings）生成假设性答案文档，以此进行向量检索，提高语义召回率。

2. **多源检索层**：
   - **Web搜索**：调用Bing/Google/SerpAPI获取Top-K结果。
   - **垂直检索**：调用知识库、学术、GitHub、Reddit等特定API。
   - **混合检索**：BM25（关键词） + Dense Vector（语义），平衡精准度与泛化性。

3. **内容提取与处理层**：
   - **网页清洗**：Readability/Trafilatura去除广告、导航栏、CSS。
   - **切分**：按语义切分文本块（Chunk），保持上下文完整性。
   - **去重与冲突检测**：MinHash LSH去重；LLM检测多源信息冲突（如不同来源数据不一致）。

4. **答案生成层（RAG Pipeline）**：
   - **上下文构建**：将Query + Top-K检索到的Snippet拼装成Prompt。
   - **引用生成**：要求LLM在生成句子时标注引用ID [1][2]，利用COT思维链确保事实有据可依。
   - **结构化输出**：Summary（摘要） + Details（正文） + References（来源链接） + Follow-up Questions（推荐追问）。

5. **后处理校验**：
   - **事实一致性**：使用NLI（Natural Language Inference）模型校验生成的答案与Reference是否存在矛盾。
   - **无答案处理**：若检索结果置信度低，直接回答"未找到相关信息"，避免幻觉。

【实战案例】
- **踩坑经验**：在实际工程中，直接拼接Snippet会导致LLM产生"幻觉引用"（即编造不存在的来源）。解决方法是在Prompt中加入指令："如果文中未提到，请勿引用"，并对生成的引用ID进行反向验证，确保ID确实存在于上下文中。

【关键代码实现（引用生成Prompt）】
```python
# 构造Prompt示例
system_prompt = """
你是一个智能搜索引擎助手。请根据参考文档回答用户问题。
要求：
1. 回答必须基于提供的参考资料。
2. 在回答中的每个事实或观点后，必须使用[citation:X]标注来源，X为文档ID。
3. 如果参考资料中没有答案，请直接回答"未找到相关信息"，不要编造。
参考资料格式：[doc_id] 内容
"""

user_query = "Perplexity AI的特点是什么？"
context = "[1] Perplexity AI是一个基于大语言模型的搜索引擎... [2] 它具有引用溯源功能..."
```

【检索策略对比】
| 维度 | BM25 (关键词) | Dense Vector (语义) | Hybrid (混合检索) |
| :--- | :--- | :--- | :--- |
| **原理** | 基于词频统计，精确匹配 | 基于向量空间，语义相似度 | 综合倒数排名融合 (RRF) | 
| **优势** | 专有名词匹配强（如型号、人名） | 解决同义词、隐含语义（如"水果"->"苹果"） | 兼顾精准度与召回率，鲁棒性最好 |
| **劣势** | 无法理解语义，"手机"搜不到"移动终端" | 可能会引入语义相近但主题偏移的噪声 | 系统复杂度高，需要调节Alpha权重 |
| **适用场景** | 刚性关键词搜索 | 概念解释、模糊意图搜索 | 生产环境通用方案 |

【RAG 处理流程图】
```text
User Query
   │
   ▼
┌──────────────┐
│ Query Plan   │ (LLM: 意图识别 & 拆解)
│   Rewriter   │
└──────┬───────┘
       │ (Sub-Queries)
       ▼
┌───────────────────────────────────────┐
│            Retrieval Layer            │
│  ┌──────────┐      ┌──────────┐      │
│  │ Web API  │      │ Vector DB│      │
│  │(Link+Snippet)│   │ (Semantic)│     │
│  └────┬─────┘      └────┬─────┘      │
└───────┼────────────────┼──────────────┘
        │                │
        ▼                ▼
┌───────────────────────────────────────────┐
│           Context Builder                 │
│  (Deduplication, Relevance Scoring, Rank) │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  LLM Generator│
              │  (Answer +    │
              │   Citations)  │
              └───────┬───────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Post-Processing     │
           │  (Fact Check, Link)  │
           └──────────────────────┘
```
