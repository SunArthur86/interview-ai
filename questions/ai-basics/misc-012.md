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

- **## 常见考点:**
1. DPO中的参考模型 pi_ref 有什么作用？如果不加会怎样？
2. beta (temperature) 参数如何调整？它对训练有何影响？
3. 相比PPO，DPO在处理长上下文时有哪些潜在劣势？
