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

**实战案例**：某金融问答系统上线后发现回答准确率虚高，引入RAGAS评测后发现Faithfulness仅为0.6，模型常基于检索到的噪声信息"编造"利率。通过建立针对数值精度的Golden Set回归测试，将Faithfulness提升至0.92。

【三层评测架构】
1. 检索质量评测（Retrieval Metrics）：
   - Recall@K：相关文档是否在Top-K中（最关键）
   - MRR（Mean Reciprocal Rank）：第一个相关文档的排名倒数，强调首位命中率
   - NDCG@K：考虑排序质量的加权指标（位置越靠前权重越高）
   - 评测集构建：人工标注（query → 相关doc列表）
   - 自动化：用强LLM（如GPT-4）作为Judge判断doc是否与query相关
2. 生成质量评测（Generation Metrics）：
   - Faithfulness（忠实度）：回答是否完全基于检索文档（反幻觉），计算依据是答案中的每个Claim能否在Context中找到对应依据
   - Answer Relevancy（答案相关性）：回答是否切题，通过反向生成问题计算相似度
   - Context Precision：检索到的上下文中有用信息占比，剔除噪声
   - Context Recall：回答所需信息是否都在上下文中，衡量检索是否漏掉关键信息
   - 工具：RAGAS / TruLens / DeepEval / Arize Phoenix 自动计算以上指标
3. 端到端评测（E2E Metrics）：
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

## 常见考点
1. **召回率 vs 准确率在检索中的权衡**：为什么RAG中Recall@K通常比Precision更重要？（答：漏掉关键文档比多召回噪声更难通过LLM补救，容易导致幻觉）
2. **LLM-as-Judge的局限性**：如何解决LLM Judge的偏好性和长度偏差？（答：使用多个模型投票、标准化Prompt、设置Reference答案进行对比）
3. **如何构建高质量的评测集**：
| 维度 | 自动化构建 | 人工构建 |
|------|------------|----------|
| 成本 | 低 (需GPT-4) | 高 (需领域专家) |
| 覆盖面 | 广，长尾数据好 | 窄，集中在核心场景 |
| 准确度 | ~85% (需校准) | 99% (Golden Truth) |
| 维护难度 | 易 (定期生成) | 难 (需人工标注) |
