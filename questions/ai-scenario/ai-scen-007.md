---
id: ai-scen-007
difficulty: L2
category: ai-scenario
subcategory: RAG系统设计
tags:
- RAG评测
- RAGAS
- Golden Set
- Faithfulness
- 检索指标
- LLM-as-Judge
feynman:
  essence: 构建检索、生成、端到端三层指标体系，驱动系统持续迭代。
  analogy: 像体检，要查血液（检索）、心脏（生成）和整体机能（端到端），综合判断健康。
  first_principle: 如何科学量化RAG系统各个环节的表现，确保迭代方向正确？
  key_points:
  - 检索层：Recall@K、MRR 衡量召回能力
  - 生成层：Faithfulness、Relevancy 衡量质量
  - 端到端：LLM-as-Judge + 用户反馈
  - CI集成：Golden Set回归阻断劣质发布
follow_up:
- LLM-as-Judge有哪些偏差？如何校准？
- 如何自动构建高质量的评测集？
- 检索指标和生成指标冲突时如何取舍？
---

# 如何为RAG系统设计完整的评测体系？包括检索质量评测和生成质量评测。

【场景分析】
RAG评测最大痛点：没有统一标准，难以量化迭代效果。需要分层评测——检索层、生成层、端到端。

**边界情况补充**：
- **多跳推理**：评测集需包含需要结合多个文档片段才能回答的问题，单纯Retrieval@K高但Context Recall低的问题。
- **否定型查询**：如"A和B的区别是什么"，模型容易泛泛而谈，需引入"Contradiction"指标评测回答是否准确区分了正反例。

【实战案例】
某金融问答系统上线后发现回答准确率虚高，引入RAGAS评测后发现Faithfulness仅为0.6，模型常基于检索到的噪声信息"编造"利率。通过建立针对数值精度的Golden Set回归测试，将Faithfulness提升至0.92。

【三层评测架构】
1. 检索质量评测：
   - Recall@K：相关文档是否在Top-K中（最关键）
   - MRR（Mean Reciprocal Rank）：第一个相关文档的排名倒数，强调首位命中率
   - NDCG@K：考虑排序质量的加权指标（位置越靠前权重越高）
   - 评测集构建：人工标注（query → 相关doc列表）
   - 自动化：用强LLM（如GPT-4）作为Judge判断doc是否与query相关
2. 生成质量评测：
   - Faithfulness（忠实度）：回答是否完全基于检索文档（反幻觉），计算依据是答案中的每个Claim能否在Context中找到对应依据
   - Answer Relevancy（答案相关性）：回答是否切题，通过反向生成问题计算相似度
   - Context Precision：检索到的上下文中有用信息占比，剔除噪声
   - Context Recall：回答所需信息是否都在上下文中，衡量检索是否漏掉关键信息
   - 工具：RAGAS / TruLens / DeepEval / Arize Phoenix 自动计算以上指标
3. 端到端评测：
   - 人工评分：1-5分（相关性、准确性、完整性、流畅性）
   - LLM-as-Judge：GPT-4作为评审，结合CoT（思维链）打分，需与人工评分校准
   - 用户反馈：点赞/点踩 + 文字反馈 + 复制率（用户复制答案代表认可）
   - 任务完成率：对于对话型系统，用户是否得到满意答案并结束对话

**代码示例**：
```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

def run_evaluation(dataset):
    # dataset需包含: question, contexts, answer, ground_truth
    result = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy]
    )
    return result # 返回包含各指标分数的DataFrame
```

【Golden Set构建】
- 规模：200~500条标注样本（Core Set 50条 + Full Set）
- 覆盖：常见问题60% + 边缘场景25% + 对抗样本15%（如否定词、多意图查询）
- 标注内容：query, 期望答案, 相关文档ID, 难度等级, 必须包含的关键Entity
- 持续维护：线上bad case回流 → 补充Golden Set

【CI/CD集成】
- 每次Prompt/模型/检索参数变更 → 跑Golden Set回归
- 设定阈值：Faithfulness > 0.85，Recall@5 > 0.80
- 不达标则阻断发布
- 成本控制：Core Set（50条）每次CI跑，Full Set发布前跑

## 易错点
1. **数据泄露**：在使用LLM自动生成评测集或作为Judge时，如果不严格控制Context，可能会利用训练数据中的先验知识而非提供的Retrieved Context来打分，导致分数虚高。
2. **指标片面性**：过度追求Faithfulness会导致回答变得极其保守（如只回答原文原话），牺牲了Answer Relevancy和用户体验，需建立综合评分机制。

## 面试追问
1. 当人工标注成本有限时，如何利用"弱监督"或"主动学习"来扩充Golden Set并保证质量？
2. RAGAS等框架计算Faithfulness的原理是基于NLI（自然语言推理），如果LLM本身推理能力不足，评测指标的可信度如何保证？
3. 如何评测RAG系统在面对"不知道"问题时拒绝回答的能力？
