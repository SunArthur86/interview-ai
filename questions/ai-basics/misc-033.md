---
id: misc-033
difficulty: L2
category: ai-basics
subcategory: Prompt Engineering
tags:
- IOC
feynman:
  essence: 通过在提示词中给范例，让模型模仿完成任务，无需训练。
  analogy: 像学书法，给字帖照着描红（给例子），描多了自然就会写了，不用改大脑结构。
  first_principle: 如何在模型参数不变的情况下，利用提示工程让模型快速适应新的下游任务？
  key_points:
  - 不需要梯度下降，仅靠上下文学习
  - 示例的顺序、格式和内容影响巨大
  - Self-Consistency通过多路径投票提升稳定性
follow_up:
- 为什么示例顺序影响这么大?
- 如何自动选择最优示例?
---

# In-Context Learning (ICL) 的原理是什么?Few-shot示例如何选择

- **ICL (In-Context Learning):** 模型从prompt中提供的示例学习模式,无需参数更新.

- **示例选择策略:**

1. **随机选择** - 基线,效果不稳定
2. **相似度选择** - 用embedding找与输入最相似的示例
3. **投票选择** - 多组示例投票,选一致性最高的
4. **多样性选择** - 选择覆盖不同模式的示例

- **关键发现:**
- 示例**顺序**影响巨大(准确率波动>10%)
- 示例**格式**必须一致
- **3-5个**示例通常效果最好
- 负面示例(错误答案)可能比正面示例更有效

- **Self-Consistency:**
1. 用不同示例生成多个答案
2. 对答案进行多数投票
3. 准确率提升5-15%

- **ICL 机制示意:**

```text
Prompt Context Window:
┌─────────────────────────────────────────────┐
│ System Instructions                         │
├─────────────────────────────────────────────┤
│ Example 1: Input -> Output  (Demonstration) │
│ Example 2: Input -> Output  (Demonstration) │
│ Example 3: Input -> Output  (Demonstration) │
├─────────────────────────────────────────────┤
│ [Test Input]  -> [??? Output]               │
└─────────────────────────────────────────────┘
         │
         ▼
  Model Inference (Gradient Free)
```

## 常见考点
1. **ICL 为什么不需要梯度更新？**
   - ICL 被认为是利用 Transformer 的注意力机制，从上下文中「检索」或「激活」模型预训练时学到的相关知识，本质上是一种前向推理时的贝叶斯学习模拟，而非权重更新。

2. **Label 空间对 ICL 有影响吗？**
   - 有。标签与其在分布中的频率、以及标签词本身在预训练中的出现频率有关。有时将输入标签映射到不常见的词汇可以提高效果。

3. **为什么 KNN（K近邻）常被用来解释 ICL？**
   - 研究表明 ICL 的行为很大程度上类似于 KNN 分类器：模型倾向于关注与测试输入最相似的示例，且随着相似示例数量的增加，性能显著提升。

- **实战案例**：在构建文本分类器时，直接随机抽取 3 个示例导致模型对长文本分类极差；改用基于 Embedding 余弦相似度检索最相似的 Top-3 示例后，长难句的分类 F1 分数提升了约 20 个百分点，解决了模型被简单示例带偏的问题。

- **代码示例**：
```python
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# 基于相似度选择 Top-K 示例
def select_few_shot_examples(query, corpus_embeddings, k=3):
    query_emb = get_embedding(query) 
    # 计算余弦相似度并获取 Top-K 索引
    scores = cosine_similarity([query_emb], corpus_embeddings)[0]
    top_indices = np.argsort(scores)[-k:][::-1] 
    return [examples[i] for i in top_indices]
```
