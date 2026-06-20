---
id: misc-016
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IO
feynman:
  essence: 利用分块计算和IO感知，减少显存访问次数，实现加速与省显存。
  analogy: 做菜时把食材分批拿到案板处理，做完一批再拿下一批，减少跑仓库次数。
  first_principle: 如何通过计算换IO，突破Attention机制中的显存与速度瓶颈？
  key_points:
  - 避免HBM读写，利用SRAM计算
  - 复杂度从O(n²)降至O(n)
  - 数学完全等价，无精度损失
  - v2优化并行度，支持超长文本
follow_up:
- Flash Attention如何处理在线Softmax?
- Flash Attention v3有什么改进?
---

# Flash Attention的原理是什么?为什么能同时加速和省显存

- **Flash Attention核心原理:**
减少HBM(显存)读写，利用GPU SRAM进行分块计算。

- **问题:** 标准Attention中QKᵀ产生n*n矩阵,频繁读写HBM(慢)

- **解决方案:Tiling(分块) + 在线Softmax**
1. 将Q/K/V分成小块加载到SRAM(片上高速缓存)
2. 在SRAM中计算部分Attention
3. **Online Softmax**: 维护分子的累加和分母的max值，避免存储完整的n×n矩阵。
4. 只将最终结果写回HBM

- **计算流程图:**
```
Q, K, V (HBM)
  │
  ▼ Tiling (分块加载到 SRAM)
┌─────────────────────┐
│ Loop over blocks (j):│
│   Load Kj, Vj        │
│   Loop over blocks (i):│
│     Load Qi          │
│     Compute Sij = Qi @ Kj.T
│     Update Softmax stats (m, l)
│     Update O = O @ Vj│
└─────────────────────┘
  │
  ▼
O (HBM)
```

- **效果:**
- **速度:** 快2-4倍(减少HBM IO)
- **显存:** O(n) 而非 O(n²)
- **精确:** 数学上完全等价,非近似

- **Flash Attention v2改进:** 调整工作负载划分以更好地利用GPU的Warp特性，支持长序列(128K+)

- **## 常见考点:**
1. 为什么在GPU上计算快但读写慢？（计算单元与显存带宽的差距）
2. Flash Attention 支持Attention Mask吗？如何实现的？
3. Flash Attention-3 在H100上使用了什么新的硬件特性（如Tensor Cores或TMA）？
