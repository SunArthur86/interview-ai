---
id: misc-047
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IOC
feynman:
  essence: 将大模型的“暗知识”（类间关系和推理过程）迁移给小模型。
  analogy: 老师不只告诉你答案是A，还告诉你B错在哪、C差多少，让你学得更透彻。
  first_principle: 如何保留大模型的知识精髓，同时实现小模型的高效部署？
  key_points:
  - 软标签：包含各类概率的平滑分布，蕴含类间相似度信息。
  - CoT蒸馏：直接学习大模型的思维链步骤，习得推理能力。
  - 目的：在保持性能的前提下，大幅压缩模型参数和推理成本。
follow_up:
- 蒸馏和量化的区别?
- 如何选择Teacher模型?
memory_points:
- 硬标签：One-hot，信息量少，仅含正确答案。
- 软标签：概率分布，含暗知识(类间相似度)，需温度T平滑。
- 蒸馏核心：用教师软标签(KL散度)指导学生模型学习。
- 实战：大模型蒸馏需防幻觉，常混合硬软标签训练。
---

# 知识蒸馏在大模型中如何应用?软标签和硬标签的区别是什么

**知识蒸馏在大模型中的应用**

知识蒸馏是一种模型压缩技术，核心思想是将庞大复杂的「教师模型」的知识迁移到轻量级的「学生模型」中。

---

### 1. 核心原理：软标签 vs 硬标签

*   **硬标签:**
    *   形式：One-hot 向量，如 `[0, 0, 1, 0]`。
    *   信息量：仅包含“正确答案”的类别信息，信息熵低，忽略了类间的相似性（例如模型可能认为“猫”像“狗”的程度远高于像“汽车”）。

*   **软标签:**
    *   形式：概率分布，如 `[0.1, 0.05, 0.8, 0.05]`。
    *   **Dark Knowledge (暗知识):** 包含了类间关系。Teacher模型输出的非正确类别的概率（如“猫”被误判为“狗”的概率0.1）蕴含了模型对特征相似性的理解。
    *   **温度参数:** 控制分布的平滑度。
        *   公式：`softmax(logits / T)`
        *   **T > 1**：分布平滑，放大暗知识（类间相似度），适合蒸馏。
        *   **T = 1**：原始分布。
        *   **T < 1**：分布尖锐，趋于 One-hot。

| 维度 | 硬标签 | 软标签 |
| :--- | :--- | :--- |
| **数据形式** | One-hot 编码 (如 [0, 1, 0]) | 概率分布 (如 [0.1, 0.8, 0.1]) |
| **信息熵** | 低 (确定性高) | 高 (包含不确定性信息) |
| **包含信息** | 仅正确类别 | 类间相似度、Dark Knowledge |
| **作用** | 指向最终答案 | 指导“如何思考”，挖掘特征关联 |
| **平滑度** | 尖锐 | 可通过 Temperature 调节 |

---

### 2. 大模型蒸馏方案架构

```text
┌─────────────────────────────────────────────────────────────┐
│                     Knowledge Distillation                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                   │
│  │  Teacher     │         │   Student    │                   │
│  │  (LLM-Large) │         │   (LLM-Small)│                   │
│  └──────┬───────┘         └──────┬───────┘                   │
│         │                         │                           │
│         │ Output Logits           │ Output Logits             │
│         │ (with Temp T)           │ (with Temp T)             │
│         │                         │                           │
│         ▼                         ▼                           │
│  [Soft Labels]           [Soft Predictions]                 │
│         └──────────┬──────────────┘                           │
│                    ▼                                         │
│         ┌──────────────────────┐                             │
│         │  Distillation Loss   │                             │
│         │  (KL Divergence)     │                             │
│         └──────────┬───────────┘                             │
│                    ▼                                         │
│              Backpropagation                                │
└─────────────────────────────────────────────────────────────┘
```

### 3. 实战与代码

*   **实战案例**：在对 70B 参数模型进行蒸馏至 7B 模型时，如果 Teacher 模型存在严重的“幻觉”（即对错误类别输出较高的置信度），直接使用其软标签会误导 Student 模型。通常需要引入辅助损失或对软标签进行截断处理。

*   **代码示例 (PyTorch)**:

```python
import torch.nn.functional as F

# temperature: 控制软标签平滑度, alpha: 蒸馏损失权重
def distillation_loss(student_logits, teacher_logits, labels, temperature=5.0, alpha=0.7):
    # 1. 计算软标签损失 (KL Divergence)
    soft_loss = F.kl_div(
        F.log_softmax(student_logits / temperature, dim=1),
        F.softmax(teacher_logits / temperature, dim=1),
        reduction='batchmean'
    ) * (temperature ** 2) # 缩放因 T^2 影响
    
    # 2. 计算硬标签损失 (交叉熵)
    hard_loss = F.cross_entropy(student_logits, labels)
    
    # 3. 加权融合
    return alpha * soft_loss + (1.0 - alpha) * hard_loss
```

## 记忆要点

- 硬标签：One-hot，信息量少，仅含正确答案。
- 软标签：概率分布，含暗知识(类间相似度)，需温度T平滑。
- 蒸馏核心：用教师软标签(KL散度)指导学生模型学习。
- 实战：大模型蒸馏需防幻觉，常混合硬软标签训练。

