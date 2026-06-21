---
id: ai-scen-005
difficulty: L2
category: ai-scenario
subcategory: RAG系统设计
tags:
- Chunking策略
- 语义分块
- 文档预处理
- 父子chunk
- RAG优化
feynman:
  essence: 平衡语义完整性与检索粒度，针对内容类型选择最佳切分策略。
  analogy: 切面包，太厚不好吃（精度低），太薄易碎（无上下文），要顺着纹理切（语义切分）。
  first_principle: 如何将长文本切分成既包含独立语义又利于检索匹配的最小单元？
  key_points:
  - 语义分块：保持句子完整，优于定长切分
  - 结构化分块：利用标题层级保留上下文
  - 特殊处理：表格、代码按逻辑单元切
  - 父子索引：小粒度检索，大粒度生成
follow_up:
- 如何自动检测最佳chunk大小？
- 对于中英混排的文档，分块策略需要调整吗？
- 父子chunk方案如何影响检索和存储成本？
---

# 在RAG系统中如何设计有效的Chunking策略？不同类型的文档应该用什么分块方法？

【场景分析】
纯向量检索擅长语义匹配但弱于精确关键词（产品名、错误码）；纯BM25擅长精确匹配但不懂同义改写。混合检索取两者之长。

**实战案例**：在一个技术文档RAG中，用户查询"报错 0x00004d"，纯Dense检索因为理解不了数字的含义召回的是"内存溢出"等语义相似文档，而混合检索通过BM25精确匹配到了包含该错误码的故障排查页，解决了找不到精确指令的问题。

【双路检索架构】
1. Sparse路径（BM25）：
   - Elasticsearch/OpenSearch全文本索引
   - 分词器：IK中文分词 + 标准英文分词
   - 优势：精确匹配、缩写、专有名词、错误码
   - 返回Top-50候选
2. Dense路径（向量）：
   - Embedding模型 → Milvus/Qdrant HNSW检索
   - 优势：语义相似、同义词、跨语言
   - 返回Top-50候选
3. 融合策略：
   - RRF（Reciprocal Rank Fusion）：score = Σ 1/(k+rank_i)，k=60
   - 加权融合：α×BM25_score + (1-α)×Dense_score
   - 线性插值需要先归一化两路分数（min-max或softmax）

**代码示例**：
```python
def reciprocal_rank_fusion(results_dict, k=60):
    fused_scores = {}
    for system, doc_list in results_dict.items():
        for rank, doc in enumerate(doc_list):
            doc_id = doc['id']
            fused_scores[doc_id] = fused_scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
```

【Query路由优化】
- 意图分类：关键词型查询 → BM25权重↑；语义型查询 → Dense权重↑
- 混合型：动态调整权重
- 短查询（<3词）倾向BM25，长查询倾向Dense

【Rerank精排】
- 融合后Top-50 → Cross-encoder Reranker精排
- 模型：bge-reranker-v2-m3 / Cohere Rerank
- 输出Top-5给LLM生成
- Rerank提升MRR通常20%~40%

【RRF 算法细节】
- 公式：$RRF(d) = \sum_{i=1}^{N} \frac{1}{k + rank_i(d)}$
- 参数：$k$ 通常取 60（平滑系数，防止排名靠后的分数差异过大）。
- 优势：无需考虑不同检索器分数的量纲差异，仅基于排序稳定性，鲁棒性强。

【评测对比】
| 策略 | Recall@10 | MRR | 延迟 |
|------|-----------|-----|------|
| 纯BM25 | 62% | 0.45 | 5ms |
| 纯Dense | 71% | 0.52 | 12ms |
| 混合+Rerank | 85% | 0.68 | 35ms |

## 常见考点
1. **BM25和向量检索的区别**：在什么场景下BM25会明显优于Dense？（答：匹配专有名词、ID、生僻词，或用户查询非常精准时；Dense在泛化能力上更强，但可能模糊边界）。
2. **分数融合的难点**：为什么不能直接相加 BM25 分数和 Cosine Similarity？（答：两者分布和量纲完全不同，直接相加会导致某种分数被淹没，必须先归一化或使用基于排名的RRF）。
3. **Rerank的性能瓶颈**：Cross-Encoder 是慢速模型，如何保证系统整体响应速度？（答：只对召回的Top-N（如50或100）进行重排，而不是全库
