---
id: misc-012
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IO
- IOC
feynman:
  essence: 利用数学推导将奖励函数消去,直接用偏好数据优化策略。
  analogy: PPO像考完试找老师打分再改错,DPO直接把正确答案和错误答案对比着改省去了打分老师。
  first_principle: 能否省略显式的奖励建模步骤,直接优化人类偏好?
  key_points:
  - 显式奖励模型RM被隐式消去
  - 只需策略模型和参考模型两个网络
  - 解决了PPO训练不稳定和奖励黑客问题
follow_up:
- DPO的beta参数如何调节?
- IPO和KTO是DPO的什么改进?
memory_points:
- DPO核心：利用RLHF最优策略闭式解，将Reward模型隐式消去
- 损失函数：基于Chosen和Rejected的Log-ratio差值，直接优化策略
- 优势：无需训练Critic和RM，显存占用低，避免Reward Hacking
- 参考模型作用：pi_ref用于计算KL散度约束，防止模型偏离过远
---

# DPO的数学推导核心是什么?为什么能跳过奖励模型

- **DPO (Direct Preference Optimization) 核心:**

利用RLHF的闭式解,将奖励模型隐式地包含在策略模型中.

- **推导关键步骤:**
1. RLHF目标: max E[r(x,y)] - beta * KL(pi||pi_ref)
2. 最优策略闭式解可反解出奖励函数
3. 代入Bradley-Terry偏好模型
4. 得到**无需RM的损失函数**

- *L_DPO = -log sigma(beta * log(pi(y_w)/pi_ref(y_w)) - beta * log(pi(y_l)/pi_ref(y_l)))*

其中 y_w=偏好回答, y_l=不偏好回答

- **实战案例:**
在RLHF微调阶段，若训练数据中存在标注噪声（如两条回答质量相近），DPO模型容易出现"伪发散"（即只提高chosen的logits而不降低rejected的），实战中常需在损失函数中加入sigmoid的margin或对log-ratio进行clip来增强鲁棒性。

- **代码示例:**
```python
# PyTorch风格伪代码
def dpo_loss(policy_chosen_logps, policy_rejected_logps, ref_chosen_logps, ref_rejected_logps, beta):
    # 计算log策略比率
    log_pi_ratio = policy_chosen_logps - policy_rejected_logps
    log_ref_ratio = ref_chosen_logps - ref_rejected_logps
    # DPO核心隐式奖励差
    logits = beta * (log_pi_ratio - log_ref_ratio)
    # 简单的二元交叉熵损失
    loss = -F.logsigmoid(logits).mean()
    return loss
```

- **## 常见考点:**
1. DPO中的参考模型 pi_ref 有什么作用？如果不加会怎样？
2. beta (temperature) 参数如何调整？它对训练有何影响？
3. 相比PPO，DPO在处理长上下文时有哪些潜在劣势？

## 记忆要点

- DPO核心：利用RLHF最优策略闭式解，将Reward模型隐式消去
- 损失函数：基于Chosen和Rejected的Log-ratio差值，直接优化策略
- 优势：无需训练Critic和RM，显存占用低，避免Reward Hacking
- 参考模型作用：pi_ref用于计算KL散度约束，防止模型偏离过远

