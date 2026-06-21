---
id: ai-scen-006
difficulty: L2
category: ai-scenario
subcategory: RAG系统设计
tags:
- 混合检索
- BM25
- Dense检索
- RRF融合
- Rerank
- Query路由
images:
- svg_rag_pipeline.svg
feynman:
  essence: 结合关键词精确匹配与向量语义理解，通过Rerank提升召回质量。
  analogy: 像“查字典+懂语境”，BM25负责精准找词，向量负责理解意思。
  first_principle: 如何同时兼顾关键词的精确匹配能力和语义的泛化理解能力？
  key_points:
  - 双路召回：BM25（精确）+ Dense（语义）
  - 融合策略：RRF或加权融合
  - Rerank精排：Cross-encoder提升Top-K准确性
  - 意图路由：根据查询类型动态调整权重
follow_up:
- RRF的k参数如何调优？
- 如果向量库和ES数据不一致怎么办？
- 如何在不增加延迟的情况下提升混合检索效果？
---

# 如何设计RAG系统的混合检索方案？结合BM25关键词检索和Dense向量检索的优势。

【场景分析】
纯向量检索擅长语义匹配但弱于精确关键词（产品名、错误码）；纯BM25擅长精确匹配但不懂同义改写。混合检索取两者之长。

**实战案例**：在一个法律合规RAG系统中，法条引用要求极其精确。纯向量检索将"民法典第一千零一条"匹配到了"人格权编"的其他条款（语义接近），而混合检索通过BM25强制匹配到了精确条文ID，避免了合规风险。

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
# 简单加权融合示例
import numpy as np

def weighted_merge(bm25_results, dense_results, alpha=0.5):
    # 归一化
    bm25_norm = (bm25_scores - bm25_scores.min()) / (bm25_scores.max() - bm25_scores.min())
    dense_norm = (dense_scores - dense_scores.min()) / (dense_scores.max() - dense_scores.min())
    return alpha * bm25_norm + (1 - alpha) * dense_norm
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

【评测对比】
| 策略 | Recall@10 | MRR | 延迟 |
|------|-----------|-----|------|
| 纯BM25 | 62% | 0.45 | 5ms |
| 纯Dense | 71% | 0.52 | 12ms |
| 混合+Rerank | 85% | 0.68 | 35ms |
