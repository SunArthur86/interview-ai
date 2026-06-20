---
id: ai-basics-s004
difficulty: L2
category: ai-basics
subcategory: 深度学习基础
feynman:
  essence: BN对batch归一化适合CV，LN对样本特征归一化适合NLP，Transformer选LN因独立于batch。
  analogy: BN是全班同学的成绩归一化，LN是你自己各科成绩的归一化。
  first_principle: 如何在训练中稳定数据分布以加速收敛？
  key_points:
  - BN依赖batch大小，受变长序列影响大
  - LN针对单个样本归一化，适合序列处理
  - RMSNorm是LN的去均值简化版，计算更高效
---

# Batch Normalization和Layer Normalization有什么区别？

**Batch Normalization (BatchNorm)**
- **计算维度**：针对 Batch (N) 和 空间维度 进行归一化。
- **计算公式**：对 Channel (C) 维度计算均值 μ 和方差 σ²。
- **适用场景**：CNN（图像）。因为图像中不同Channel对应同一类特征（如边缘、纹理），在Batch维度统计是合理的。
- **缺陷**：
  - 依赖 Batch Size。若 Batch Size=1，方差为0无法计算；若太小，统计量噪声大。
  - 训练/推理行为不一致：推理时使用全局累积的 running mean/var，而非当前数据。
  - 不适合 RNN：序列长度不同，且每个时间步的 BatchNorm 参数不共享，难以处理变长序列。

**Layer Normalization (LayerNorm)**
- **计算维度**：针对 Channel (C) 和 空间维度 进行归一化。即对单个样本的所有特征计算均值方差。
- **计算公式**：`x = (x - mean) / sqrt(var + eps)`，其中 mean/var 是在 特征维度 上计算的。
- **适用场景**：Transformer / NLP。
- **优势**：
  - 不依赖 Batch Size。Batch Size=1 也能正常工作。
  - 训练/推理一致，无需维护 running statistics。
  - 适合处理变长序列（对每个 token 独立归一化）。

**架构对比图**：
```text
数据形状: [Batch, Channel, Height, Width] (图像) 或 [Batch, Seq_Len, Hidden] (NLP)

┌───────────────────────────────────────────────────────┐
│ BatchNorm (图像例子)                                    │
│ 对每个 Channel，统计 Batch 内所有像素                  │
│ Stats: [Batch, Height, Width] -> [1] per Channel      │
│ 输出: 保持每个 Channel 的分布一致                     │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ LayerNorm (NLP例子)                                    │
│ 对每个 Token，统计其 Hidden 维度所有特征              │
│ Stats: [Hidden] -> [1] per Token                      │
│ 输出: 保持每个 Token 的向量模长/分布一致              │
└───────────────────────────────────────────────────────┘
```

### 对比表格

| 特性 | Batch Normalization | Layer Normalization |
| :--- | :--- | :--- |
| **统计维度** | 沿 Batch 维度统计 (N, H, W) | 沿 特征 维度统计 (C, H, W) 或 (Hidden) |
| **Batch Size 依赖** | 强依赖 (BS=1失效) | 不依赖 (BS=1可用) |
| **主要应用** | CNN (计算机视觉) | Transformer / RNN (NLP) |
| **训练/推理一致性** | 不一致 (推理用Running Mean) | 一致 (无Running Mean) |
| **目标** | 固定每层特征分布，防止梯度消失/爆炸 | 固定单个样本的向量范数，稳定训练 |

### 实战案例
在**BERT微调**任务中，如果下游任务的Batch Size设置得很小（如Batch Size=2或4），若将模型中的LayerNorm误替换为BatchNorm，模型将无法收敛，因为小Batch计算出的统计量方差极大，导致梯度混乱。此外，在**目标检测（如Faster R-CNN）**的某些特殊Head中，由于RoI的大小不一，使用标准的BatchNorm往往效果不佳，此时通常改用**GN (Group Norm)** 或 **LN** 来消除对Batch Size的依赖。

### 代码示例
```python
import torch
import torch.nn as nn

# 输入形状: [Batch_Size=2, Channel=3, Height=32, Width=32]
x = torch.randn(2, 3, 32, 32)

# BatchNorm: 对每个Channel，统计2x32x32个像素
bn = nn.BatchNorm2d(num_features=3)
output_bn = bn(x) 

# LayerNorm (CNN中应用): 对每个样本，统计3x32x32个像素
# 这里的 normalized_shape 是除了Batch之外的维度
ln = nn.LayerNorm(normalized_shape=[3, 32, 32])
output_ln = ln(x)
```

**为什么 Transformer 用 LayerNorm 而不是 BatchNorm？**
1. **样本独立性**：NLP 中句子长度差异大，BatchNorm 难以对齐；LayerNorm 处理每个样本内部，天然支持变长。
2. **显存与并行**：LLM 训练 often 采用 Micro-Batch (甚至=1) 进行梯度累积，BatchNorm 会失效。
3. **语义表达**：在 NLP 中，一个 Token 的所有特征共同构成语义，对特征维度归一化更符合语义空间稳定性需求。

**衍生技术**：
- **RMSNorm (Root Mean Square Normalization)**：LayerNorm 的简化版，去掉了减去均值的操作（Centering），只除以 RMS。效果相当但计算量减少（省去了求和操作），在 LLaMA 等大模型中广泛使用。
  - 公式：`x = x / sqrt(mean(x²) + eps) * γ` (无 β 参数)。

## 常见考点
1. **RMSNorm和LayerNorm的区别？**（答：RMSNorm去掉了均值中心化，计算更快，性能相当，LLM常用）
2. **BatchNorm在推理时怎么处理？**（答：使用训练时累积的全局running_mean和running_var，冻结更新）
