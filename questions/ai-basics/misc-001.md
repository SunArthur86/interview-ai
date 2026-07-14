---
id: misc-001
difficulty: L2
category: ai-basics
subcategory: 大模型原理
tags:
- IO
feynman:
  essence: 序列内元素通过QK计算相关性并加权聚合V，实现全局并行信息交互。
  analogy: 每个人同时看一眼全场，决定听谁的；RNN像传声筒一个个传。
  first_principle: 如何打破序列计算的串行限制并捕捉全局上下文？
  key_points:
  - Q、K、V由输入线性变换得到
  - 计算复杂度随序列长度平方增长
  - 相比RNN能直接捕捉长距离依赖
follow_up:
- 为什么除以√d_k?--防止点积过大导致softmax梯度消失
- Multi-Head Attention的作用?--不同head学习不同子空间的注意力模式
memory_points:
- 定义：序列中每个位置直接关注所有其他位置，计算加权求和。
- 对比RNN：Self-Attention并行计算，长距离依赖O(1)；RNN串行，依赖O(N)。
- 复杂度：Self-Attention为O(N²·d)，RNN为O(N·d²)。
- 优势：并行度高，捕捉长距离信息能力强，注意力权重可解释。
---

# Transformer中的Self-Attention机制是什么?为什么比RNN更高效

Self-Attention允许序列中每个位置直接关注所有其他位置,计算加权求和.

- **核心公式:**
Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V

- **Q/K/V的来源:** 输入X分别乘以三个权重矩阵Wq/Wk/Wv

- **优势:**
1. **并行计算** - RNN必须串行处理,Self-Attention可并行
2. **长距离依赖** - 任意两个token间距离为O(1),RNN为O(n)
3. **可解释性** - 注意力权重矩阵可视化理解模型关注点

- **复杂度对比:**
- Self-Attention: O(n²·d) - 序列长度平方,但可并行
- RNN: O(n·d²) - 序列长度线性,但必须串行

### 对比表格

| 维度 | RNN (LSTM/GRU) | Self-Attention (Transformer) |
| :--- | :--- | :--- |
| **计算并行度** | 串行 (t步依赖t-1步) | 并行 (所有Token同时计算) |
| **长距离依赖** | O(N) 路径长，信息易衰减 | O(1) 直接连接，无衰减 |
| **计算复杂度** | O(N · d²) | O(N² · d) (主要瓶颈在矩阵乘法) |
| **显存占用** | 较低 (线性) | 较高 (需存储N×N注意力矩阵) |
| **归纳偏置** | 强假设 (局部性、时序性) | 弱假设 (关系需从数据学习) |

### 实战案例
在早期的**情感分析**任务中，使用LSTM往往难以捕捉段落末尾的关键转折词（如“但是...”）对开篇的影响，导致分类错误。切换到Transformer架构后，模型能直接建立“但是”与前面所有词的连接，准确率显著提升。然而，在处理超长序列（如全基因组测序）时，标准Transformer的O(N²)复杂度会导致显存溢出（OOM），此时必须改用**Linear Attention**或**RNN**等线性复杂度模型，或者切分片段使用滑动窗口机制。

### 代码示例
```python
import torch
import torch.nn as nn

class SelfAttention(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.multihead_attn = nn.MultiheadAttention(embed_dim, num_heads)

    def forward(self, x):
        # x shape: [Seq_Len, Batch, Dim] (MHA默认需要L第一)
        attn_output, attn_weights = self.multihead_attn(x, x, x)
        return attn_output

# 模拟输入：序列长度10，Batch 2，维度512
input_tensor = torch.randn(10, 2, 512)
model = SelfAttention(embed_dim=512, num_heads=8)
output = model(input_tensor)
```

## 记忆要点

- 定义：序列中每个位置直接关注所有其他位置，计算加权求和。
- 对比RNN：Self-Attention并行计算，长距离依赖O(1)；RNN串行，依赖O(N)。
- 复杂度：Self-Attention为O(N²·d)，RNN为O(N·d²)。
- 优势：并行度高，捕捉长距离信息能力强，注意力权重可解释。

