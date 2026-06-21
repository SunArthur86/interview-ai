---
id: misc-011
difficulty: L2
category: ai-basics
subcategory: 训练与微调
feynman:
  essence: 高质量、多样化的指令数据对是激发模型指令跟随能力的关键。
  analogy: 教徒弟,教一千个精典案例比让他瞎练一万次更有用,还要防止他忘基本功。
  first_principle: 如何构建数据才能在注入新指令的同时保留原有知识?
  key_points:
  - LIMA观点:高质量数据质量远胜数量
  - 防遗忘:混入原语料+用LoRA
  - 数据要对齐真实用户意图的分布
follow_up:
- 如何评估SFT模型的通用能力损失?
- CoT数据在SFT中占多大比例合适?
---

# SFT数据集的构建有哪些最佳实践?如何避免灾难性遗忘

- **SFT数据构建最佳实践:**

1. **多样性优先** - 覆盖多种任务类型和领域
2. **质量>数量** - 1K条高质量数据 > 10万条低质量
3. **格式统一** - ChatML/Alpaca/ShareGPT格式
4. **CoT数据** - 包含思维链推理过程
5. **指令多样性** - 同一意图用不同表达方式

- **避免灾难性遗忘:**
1. **混入预训练数据** - SFT数据中混合10-20%原始预训练文本
2. **低学习率** - 用预训练lr的1/10
3. **LoRA/QLoRA** - 冻结原始权重,天然防止遗忘
4. **课程学习** - 从简单到复杂逐步训练

- **## 常见考点:**
1. 也就是常说的「数据飞轮」，SFT数据质量不好会对模型造成什么不可逆影响？
2. 在SFT阶段，如何平衡多轮对话数据和单轮指令数据？
3. 什么是Evol-Instruct？它在SFT数据构建中起什么作用？

**3. 实战案例与代码**

* **实战踩坑**：在构建多轮对话数据时，如果直接将多轮历史拼接成一条长样本进行 SFT，模型容易在长上下文中丢失指令核心或过度模仿历史语气。**最佳实践**是训练时 Mask 掉历史部分的 Loss，只计算当前回复部分的梯度（Assistant Mask），并适当降低系统提示词的占比。

* **代码示例 (数据处理与 Mask)**:
```python
import torch

def compute_sft_loss(logits, labels, user_mask):
    """
    logits: [batch, seq_len, vocab_size]
    labels: [batch, seq_len] (包含 user 和 assistant 内容)
    user_mask: [batch, seq_len] (1为user输入，0为assistant输出)
    """
    # 计算 CrossEntropy (通常 shift logits and labels)
    shift_logits = logits[..., :-1, :].contiguous()
    shift_labels = labels[..., 1:].contiguous()
    
    # 创建 Loss Mask: 只有 Assistant 的部分才计算 loss
    # 注意 mask 维度要对齐，通常 user_mask 也要 shift
    loss_mask = ~user_mask[..., 1:].contiguous() 
    
    loss_fct = torch.nn.CrossEntropyLoss(reduction='none')
    loss = loss_fct(shift_logits.view(-1, shift_logits.size(-1)), shift_labels.view(-1))
    
    # 应用 mask 并求平均
    loss = (loss * loss_mask.view(-1)).sum() / loss_mask.sum()
    return loss
```
