---
id: misc-004
difficulty: L2
category: ai-basics
subcategory: 大模型原理
tags:
- IO
- IOC
feynman:
  essence: 缓存历史K/V矩阵,将生成复杂度从平方级降为线性级。
  analogy: 做算术题,已经算过的步骤直接抄答案,不用每次都从头重算。
  first_principle: 如何消除自回归生成中重复计算历史信息的冗余?
  key_points:
  - 显存换时间:用空间存KV换取生成速度
  - 动态增长:每生成一个新词存一次KV
  - 长颈瓶:KV显存占满是提升batch的主要障碍
follow_up:
- PagedAttention如何减少显存碎片?
- GQA为什么能减少KV Cache大小?
memory_points:
- 缓存历史Key/Value避免重复计算，每步只算新token的Q与缓存做Attention
- 加速原理：计算复杂度从O(n²)降至O(n)，省去历史token的投影计算
- 代价：显存占用随序列长度线性增长，公式为2×层数×长度×维度×字节数
- 瓶颈：长文本推理中KV Cache常比模型权重更占显存，导致Batch受限
---

# 什么是KV Cache?它为什么能加速自回归生成?有什么代价

KV Cache缓存已计算token的Key和Value矩阵,避免重复计算.

- **原理:**
生成第t个token时,前t-1个token的K/V不变(因为Self-Attention需要所有历史K/V).缓存它们后,每步只需计算新token的Q与已有K/V做Attention.

**补充细节：**
Self-Attention 的计算公式为 $Attention(Q, K, V) = softmax(\frac{QK^T}{\sqrt{d}})V$。
在生成阶段，输入序列逐个增加。设当前生成了 $t$ 个 token，需要计算第 $t+1$ 个 token。
- 传统方式：输入整个序列 $(t+1)$，重新计算 $Q_{t+1}, K_{1:t+1}, V_{1:t+1}$。$K$ 和 $V$ 包含大量重复计算。
- KV Cache 方式：只计算新 token 的 $q_{new}, k_{new}, v_{new}$，并将 $k_{new}, v_{new}$ 拼接到缓存中。Attention 计算变为 $q_{new} \cdot [k_{cached}; k_{new}]^T$。

**显存计算公式细化**：
KV Cache Size (Bytes) = $2 \cdot (n_{layers}) \cdot (seq\_len) \cdot (n_{heads} \cdot d_{head}) \cdot (n_{bytes}) \cdot (2 \text{ for K and V})$。
注意：KV Cache 不包含梯度信息，因此比模型权重占用的显存通常小，但随着序列长度线性增长，是长文本推理的主要瓶颈。

**实战案例：**
在部署LLaMA-2-70B进行对话时，若显存刚好够加载模型权重（约140GB FP16），但Batch Size一加大就OOM，通常是因为 **KV Cache显存** 随上下文长度和并发线性增长。vLLM通过PagedAttention技术将其类比OS虚拟内存，解决了显存碎片问题，使得吞吐量提升2-4倍。

**代码示例 (伪代码 - KV Cache 更新)：**
```python
# prev_k: [batch, seq_len, heads, head_dim]
# new_k:  [batch, 1, heads, head_dim]

# 拼接操作 (实际推理中通常预分配内存然后填入)
updated_kv_cache = {
    "k": torch.cat([cache_k, new_k], dim=1),
    "v": torch.cat([cache_v, new_v], dim=1)
}
# Attention 计算: q_new @ updated_kv_cache["k"].transpose(...)
```

- **加速效果:**
- 无缓存:O(n²) 次矩阵乘法 (针对生成长度为n的整个过程，或单步复杂度描述)
- 有缓存:O(n) 次矩阵乘法
(注：这里的加速是指生成过程中的单步计算复杂度从 O(seq_len) 的计算量变成了 O(1) 的矩阵更新 + O(seq_len) 的 Attention Score 计算，避免了重复投影 Key/Value 的 O(seq_len * hidden_dim) 计算)

- **代价:**
1. **显存占用:** KV Cache大小 = 2 × n_layers × seq_len × hidden_dim × dtype_size
- 例如LLaMA-70B, 4K上下文, FP16: ~16GB KV Cache
2. **批量大小受限:** KV Cache占满显存后无法增大batch

- **优化方案:**
- PagedAttention (vLLM) - 操作系统式分页管理KV Cache (解决显存碎片)
- GQA/MQA - 共享K/V减少Cache大小 (物理上减少 Key/Value 的 Head 数量)
- 量化KV Cache - INT8/FP8压缩 (降低数据类型精度)
- FlashAttention - 优化 Attention 计算的显存访问速度 (减少 HBM 读写次数)

**ASCII 流程图（KV Cache 工作原理）：**
```
Step 1: Input "Hello"
  Q1, K1, V1 (计算) ──┐
                      ▼
              [ KV Cache ] <K1, V1>

Step 2: Input "World" (Need attention on "Hello")
  Q2 (计算)            │
  K2, V2 (计算) ───────┼──► [ Concat: K1+K2, V1+V2 ]
                      │       │
                      │       ▼
                      └──► Attn(Q2, <K1, K2>, <V1, V2>) -> Output2
                              ▲
                              │
                      [ Updated KV Cache ] <K1, K2, V1, V2>

Step 3: Input "!" (Need attention on "Hello World")
  Q3 (计算)            │
  K3, V3 (计算) ───────┼──► [ Concat: K1+K2+K3, ... ]
                      │       │

## 记忆要点

- 缓存历史Key/Value避免重复计算，每步只算新token的Q与缓存做Attention
- 加速原理：计算复杂度从O(n²)降至O(n)，省去历史token的投影计算
- 代价：显存占用随序列长度线性增长，公式为2×层数×长度×维度×字节数
- 瓶颈：长文本推理中KV Cache常比模型权重更占显存，导致Batch受限

