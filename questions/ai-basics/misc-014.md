---
id: misc-014
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IO
feynman:
  essence: 多源数据混合配比，代码数据提升逻辑推理与结构化能力。
  analogy: 像给孩子搭配营养餐，代码是补脑的核桃，提升逻辑智力。
  first_principle: 如何通过数据配比最大化模型的逻辑推理与通用知识能力？
  key_points:
  - 通用知识需中英均衡
  - 代码占比约15%增强推理
  - 多语言和科学数据辅助
  - 代码是工具调用基础
follow_up:
- 数据去重的方法和重要性?
- 如何平衡数据量和质量?
---

# 预训练数据配比如何设计?代码数据为什么重要

- **预训练数据配比策略:**

| 数据类型 | 推荐比例 | 作用 |
|---------|---------|------|
| 英文网页/书籍 | 35-45% | 通用知识、英文能力 |
| 中文网页/书籍 | 25-35% | 中文语言能力 |
| 代码 | 10-20% | **推理能力、结构化思维** |
| 数学/科学论文 | 5-10% | 逻辑推理 |
| 多语言 | 5-10% | 跨语言迁移 |

- **为什么代码数据重要:**
1. **推理迁移** - 代码训练大幅提升数学和逻辑推理
2. **结构化表达** - 代码训练让模型更善于输出结构化内容
3. **工具使用** - 代码理解能力是Function Calling的基础
4. **实证:** Code LLaMA在数学和推理上远超同参数量的LLaMA

- **实战案例:**
在Qwen或DeepSeek的训练实践中，若将代码比例从10%降至5%，模型的GSM8K数学成绩通常会下降5%以上，且输出JSON格式的稳定性会显著变差，这证明了代码对于"思维链"和格式约束的基础性作用。

- **代码示例:**
```python
# 数据混配伪代码
from torch.utils.data import WeightedRandomSampler

# 假设有不同来源的dataset列表
datasets = [web_dataset, code_dataset, math_dataset]
# 权重对应配比：如代码权重设为 20, web设为 40
weights = [40.0, 20.0, 10.0] 

# 构建采样器，确保每个batch的数据来源符合预设配比
sampler = WeightedRandomSampler(weights, num_samples=10000, replacement=True)
dataloader = DataLoader(ConcatDataset(datasets), sampler=sampler)
```

- **## 常见考点:**
1. 数据配比中的「教科书质量」具体指什么样的数据清洗标准？
2. 为什么数学数据不能完全替代代码数据来提升推理能力？
3. 预训练阶段代码数据的去重（如基于AST去重）为何很重要？
