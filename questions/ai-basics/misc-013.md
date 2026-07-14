---
id: misc-013
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IO
feynman:
  essence: 用组内采样的相对优势替代Critic模型估计,大幅降低显存。
  analogy: PPO找裁判打分,GRPO让几个人互相比,不用裁判,看谁相对更好就给谁加分。
  first_principle: 如何在去除Critic模型的情况下准确估计策略优势?
  key_points:
  - 去掉了PPO中的Critic(Value)模型
  - 优势值来自同组输出的归一化分数
  - 显存减半,训练更快,适合强化学习推理
follow_up:
- GRPO的组大小G如何选择?
- GRPO为什么能涌现长链推理?
memory_points:
- GRPO用组内相对奖励替代Critic模型，省去Value网络显存
- 优势计算：A_i = (r_i - mean(r)) / std(r)，通过组内归一化消除尺度差异
- 相比PPO：显存更低（只需Policy和RM），训练更快，稳定性更好
- 实战：组大小G需适中，过大会增加方差和成本，过小则基准不准
---

# DeepSeek提出的GRPO算法是什么?相比PPO有什么优势

- **GRPO (Group Relative Policy Optimization):**

PPO需要一个Critic模型估计baseline, GRPO用**组内相对奖励**替代Critic.

- **核心区别:**
| | PPO | GRPO |
|--|-----|------|
| Critic模型 | 需要(额外显存) | **不需要** |
| Baseline | Critic估计 | 组内均值 |
| 显存占用 | 高(4个模型) | **低(2个模型)** |
| 训练速度 | 慢 | **快** |

- **GRPO流程图:**
```
问题 Prompt x
      │
      ▼
┌───────────────┐
│  采样 G 个回答 │
│  (θ_old)      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ 奖励模型评分   │
│ (R1...Rg)     │
└───────┬───────┘
        │
        ▼
┌───────────────────────┐
│ 计算优势函数           │
│ A_i = (r_i - mean(r)) │
│          / std(r)     │
└───────┬───────┘
        │
        ▼
   更新策略 θ
```

- **优势:**
- 省显存 - 去掉Critic模型
- 更稳定 - 组内归一化消除奖励尺度问题
- 效果好 - DeepSeek-R1证明GRPO可训练出顶级推理能力

- **实战案例:**
在数学推理任务中，如果组大小 G 设置过大（如 G=64），不仅增加推理成本，且组内样本方差增大会导致优势函数趋近噪声，通常需根据模型能力动态调整 G，且对于确定性任务需在优势函数计算中加入 min_std 防止除零。

- **代码示例:**
```python
# 优势函数计算片段
import torch

def compute_group_advantage(rewards):
    mean = rewards.mean()
    std = rewards.std()
    # 防止std为0导致梯度爆炸
    if std < 1e-6:
        std = 1.0 
    # 核心优势：相对组内均值的归一化优势
    advantages = (rewards - mean) / std
    return advantages
```

- **## 常见考点:**
1. GRPO中的组大小 G 如何选择？太小或太大有什么影响？
2. 对于确定性输出（如数学题），组内方差较小时，GRPO的梯度更新是否有效？
3. GRPO相比其他不依赖Critic的算法（如REINFORCE）的核心改进点在哪里？

## 记忆要点

- GRPO用组内相对奖励替代Critic模型，省去Value网络显存
- 优势计算：A_i = (r_i - mean(r)) / std(r)，通过组内归一化消除尺度差异
- 相比PPO：显存更低（只需Policy和RM），训练更快，稳定性更好
- 实战：组大小G需适中，过大会增加方差和成本，过小则基准不准

