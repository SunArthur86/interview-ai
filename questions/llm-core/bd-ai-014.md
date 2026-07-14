---
id: bd-ai-014
difficulty: L4
category: llm-core
categories:
- ai-agent
- eng-practice
- llm-core
subcategory: 训练与微调
tags:
- 字节
- 面经
- SFT
- RLHF
- DPO
feynman:
  essence: SFT靠优质数据快速成型，RLHF靠反馈奖励对齐偏好，正向自动化发展。
  analogy: SFT像照着模范书练习（有样学样），RLHF像老师根据表现打分（纠正偏差）。
  first_principle: 如何高效地将基础模型能力转化为符合人类价值观的高质量智能？
  key_points:
  - SFT迭代快，适合注入知识能力；RLHF效果上限高，适合对齐
  - 基模强时，SFT核心是数据质量而非数量
  - RLHF趋向自动验证（如代码运行结果）替代人工打分
  - DPO简化RL流程，成为新主流
follow_up:
- DPO和PPO的区别？——DPO无需RM、无需在线采样，直接离线优化偏好
- RLHF的Reward Model怎么训？——用人类偏好对（chosen/rejected）做排序学习
- 基模强了还需要微调吗？——需要，但重点从知识注入转向行为对齐
memory_points:
- 迭代速度：SFT(单步闭环)快于RLHF(需训RM+PPO)，SFT适合快速试错
- SFT破局点：重质量轻数量，几百条高质量数据优于万条普通数据
- RLHF破局点：从人工标注转向自动反馈(如代码能否跑通)，用DPO简化流程
- DPO优势：无需显式Reward Model，直接在偏好对上优化，工程落地简单
- 基模变强：SFT靠数据蒸馏，RLHF靠规则验证(Verifiable Reward)
---

# 【字节面经】SFT和RLHF哪个更适合快速迭代？在基模能力越来越强的情况下，这两者的破局点是什么？

**SFT更适合快速迭代。**

**对比：**
- **SFT**（监督微调）：流程简单——准备问答对直接训。几个小时到一天出结果。
- **RLHF**：需要先训Reward Model再做PPO。链路长、工程复杂、稳定性差，一个迭代周期可能是SFT的好几倍。

**但RLHF的优势是能对齐人类偏好。** SFT只能学到数据里的模式，RLHF能学到什么是好的。

**基模变强后的破局点：**

**SFT的破局点 = 数据质量而非数量。**
- 几百条高质量数据的效果可能比几万条普通数据好
- 关键是构造出模型自己想不出来的优质回答
- DeepSeek-R1验证了：少量推理链数据可以做SFT蒸馏

**RLHF的破局点 = 从人工标注走向自动反馈。**
- 用Verifiable Reward（可验证奖励）替代人工打分
- 代码能不能跑通、数学题对不对——自动验证
- DeepSeek-R1用GRPO+规则奖励实现RL，无需人工标注
- DPO简化了RLHF流程（无需显式RM），成为快速对齐首选

**实战案例：** 在做Code Agent时，先用SFT教模型调用接口，但模型经常在参数顺序上出错。引入RLHF/DPO阶段，使用“代码能否通过编译”作为自动Reward信号进行强化训练，模型的代码可执行性从60%提升到了90%。

**代码示例 (TRL + DPO)：**
```python
from trl import DPOTrainer

dpo_trainer = DPOTrainer(
    model,
    ref_model,
    args=training_args,
    beta=0.1, # 温度参数，控制对齐强度
    train_dataset=train_dataset,
    # dataset 包含: prompt, chosen(好回答), rejected(坏回答)
)
# 相比PPO，DPO不需要显式的Reward Model，直接在偏好对上优化，工程落地简单得多
```

**SFT vs RLHF/DPO 流程对比：**
```text
SFT Pipeline:                    RLHF/DPO Pipeline:

  Data (Q&A)                       Data (Prompts)
     │                                 │
     ▼                                 ▼
[Loss Calc]                     ┌─────────────────┐
(Predict Target)                │  Generate/Explore│
     │                          └────────┬────────┘
     ▼                                   │
┌─────────┐                     ┌────────▼────────┐
│ Update  │                     │ Reward Scoring  │
│ Weights │                     │ (RM or Rule)    │
└─────────┘                     └────────┬────────┘
                                        │
                                     ┌───▼────┐
                                     │ Update │ (DPO/PPO)
                                     │Weights │
                                     └────────┘

特点: 单步闭环，极快              特点: 双模型/多步交互，慢但细腻
```

## 常见考点
1. **DPO原理**：为什么DPO不需要训练单独的Reward Model？（DPO直接利用偏好数据优化策略，将Reward隐式地消解在策略比对中，推导自RL的目标函数）
2. **Reward Hacking**：在RLHF训练中，模型学会欺骗Reward Model得分高但输出质量差，怎么破？（使用混合Reward：模型评分 + 规则约束 + 人工抽检）
3. **数据规模效应**：在SFT中，为什么有时候增加数据反而效果变差？（数据质量分布不均，低质量数据污染了模型原有的通用能力，需严格数据清洗和课程学习Curriculum Learning）

## 记忆要点

- 迭代速度：SFT(单步闭环)快于RLHF(需训RM+PPO)，SFT适合快速试错
- SFT破局点：重质量轻数量，几百条高质量数据优于万条普通数据
- RLHF破局点：从人工标注转向自动反馈(如代码能否跑通)，用DPO简化流程
- DPO优势：无需显式Reward Model，直接在偏好对上优化，工程落地简单
- 基模变强：SFT靠数据蒸馏，RLHF靠规则验证(Verifiable Reward)

