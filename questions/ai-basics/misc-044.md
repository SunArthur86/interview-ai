---
id: misc-044
difficulty: L2
category: ai-basics
subcategory: 评估与安全
tags:
- IO
feynman:
  essence: 让模型依据「宪法」原则自我修正，摆脱对人工标注的依赖。
  analogy: 像给学生一本《行为守则》让他自评自改，而不是老师逐题打分。
  first_principle: 如何让模型在无人工干预下，自动习得并遵循人类价值观？
  key_points:
  - SL-CAI阶段：根据原则自我批评并修正，生成监督数据。
  - RL-CAI阶段：AI模型充当判别器生成偏好数据进行强化学习。
  - 相比RLHF，成本低、一致性强、价值观显式定义。
follow_up:
- 宪法原则如何设计?
- CAI会不会引入AI偏见?
---

# Constitutional AI (CAI)是什么?它和RLHF有什么区别

- **Constitutional AI (Anthropic提出):**

- **核心思想:** 用一组「宪法原则」(不要有害/要诚实/要公平等)指导模型自我修正,减少对人工标注的依赖.

- **两阶段:**
1. **监督学习阶段 (SL-CAI):**
- 模型生成回复 → 用宪法原则自我评价 → 修改后的回复作为SFT数据
2. **强化学习阶段 (RL-CAI):**
- 模型A生成回复 → 模型B(遵循宪法)评估哪个更好 → 用偏好对做RL(类似RLHF但RM是模型而非人)

- **实战案例**：在构建金融合规模型时，使用 RLHF 需要专家标注大量“合规/不合规”样本，成本极高且标准不一。引入 CAI 后，将“必须引用法规”、“不得提供投资建议”等写入宪法，模型能自动修正违规回复，显著降低专家介入成本。

- **代码示例 (伪代码 - SL-CAI 生成流程)**：
```python
# 模拟 Constitutional AI 自我修正过程
def generate_cai_response(prompt, model, constitution):
    # 1. 初始生成
    raw_response = model.generate(prompt)
    
    # 2. 根据宪法批评
    critique_prompt = f"""
    Principles: {constitution}
    Response: {raw_response}
    Critique the response based on principles.
    """
    critique = model.generate(critique_prompt)
    
    # 3. 根据批评修正
    revision_prompt = f"""
    Original Response: {raw_response}
    Critique: {critique}
    Revise the response based on the critique.
    """
    final_response = model.generate(revision_prompt)
    return (prompt, final_response) # 作为 SFT 数据
```

- **CAI vs RLHF:**
| | RLHF | CAI |
|--|------|-----|
| 偏好来源 | 人类标注 | **AI自我评估** |
| 成本 | 高(人工) | **低** |
| 一致性 | 低(标注者分歧) | **高** |
| 可扩展性 | 差 | **好** |
| 价值观 | 隐式(标注者) | **显式(宪法)** |

- **效果:** Claude系列用CAI训练,在安全性和有用性之间取得更好平衡

- **补充关键细节**：
  - **宪法原则**：通常包含多条规则的列表，例如“请选择对人类无害的回复”、“如果被要求帮助网络攻击，请拒绝”。这些原则不仅指导最终回答，还指导中间的批评过程。
  - **SL-CAI (Supervised Learning)**: 这是一个自我批评过程。模型先生成一个“初步回答”，然后根据宪法生成“批评意见”和“修改后的回答”。这一步主要为了让模型学会遵循宪法格式和修正风格。
  - **RL-CAI (Reinforcement Learning)**: 使用AI生成的偏好数据训练奖励模型（RM）。因为RM是基于宪法训练的，它保证了奖励信号与宪法原则的一致性，避免了RLHF中人类标注者主观标准不一的问题。
  - **RLAIF (RL from AI Feedback)**: CAI的一种具体实现形式。利用AI Feedback替代Human Feedback，解决了RLHF随着模型能力增强，人类越来越难判断回答好坏的瓶颈问题。

```text
┌──────────────────────────────────────────────────────────────────┐
│                  Constitutional AI (CAI) 流程                    │
└──────────────────────────────────────────────────────────────────┘

阶段一: SL-CAI (监督学习 - 学会自我修正)
┌───────────────────┐      ┌───────────────────┐
│  有害/初始提问     │ ──>  │  模型生成初始回复  │
└───────────────────┘      └─────────┬─────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │  AI 依据宪法批评   │
                          └─────────┬─────────┘
                                    │
                                    ▼
                          ┌───────────────────┐      ┌──────────────┐
                          │  AI 生成修正回复   │ ──> │ SFT 训练数据  │
                          └───────────────────┘      └──────────────┘

阶段二: RL-CAI (强化学习 - 学习偏好)
┌───────────────────┐      ┌───────────────────┐
│  提问             │ ──>  │ 生成两个回复      │
└───────────────────┘      │ (Response A & B)  │
                          └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ AI 基于宪法评分    │
                          └─────────┬─────────┘
                                    ▼
                          ┌───────────────────┐
                          │ RL 训练 (PPO)      │
                          └───────────────────┘
```
