---
id: misc-015
difficulty: L2
category: ai-basics
subcategory: 训练与微调
tags:
- IO
feynman:
  essence: 通过切分优化器状态、梯度和参数，打破显存墙，训练超大模型。
  analogy: 多人合伙买房，每人只出一份钱，共同拥有整套房子。
  first_principle: 如何在有限显存下训练参数量远超单卡容量的模型？
  key_points:
  - Stage 1切优化器，Stage 2切梯度
  - Stage 3切参数，支持最大模型
  - 通信代价随级别递增
  - 大模型首选ZeRO-3
follow_up:
- ZeRO-3的通信开销如何估算?
- Tensor Parallelism和ZeRO能否同时使用?
---

# ZeRO (Zero Redundancy Optimizer)的三级优化分别是什么?如何选择

- **ZeRO (Zero Redundancy Optimizer)三级优化:**

| 级别 | 切分对象 | 显存节省 | 通信量 |
|------|---------|---------|--------|
| ZeRO-1 (Os) | 优化器状态 | 4x | 与DP相同 |
| ZeRO-2 (Os+G) | + 梯度 | 8x | 略增 |
| ZeRO-3 (Os+G+P) | + 模型参数 | **~Nx** | **显著增加** |

- **ZeRO-3 (Add Parameter Partitioning) 架构:**
```
GPU 0:  [W0] [G0] [Os0]
GPU 1:  [W1] [G1] [Os1]
GPU 2:  [W2] [G2] [Os2]
GPU 3:  [W3] [G3] [Os3]
         │
         │ All-Gather (通信)
         ▼
  Forward Pass (临时聚合完整参数)
         │
         ▼
    Backward Pass
```
- 模型参数也切分,每张卡只存1/N
- 前向/反向时动态All-Gather收集参数
- 适合:**超大模型(>70B)或多卡训练**
- 代价:通信量约为ZeRO-2的1.5倍

- **实战案例:**
在使用DeepSpeed ZeRO-3训练70B模型时，若遇到显存刚好装下但训练速度极慢的情况，通常是因为`bucket_size`配置过小导致All-Gather通信过于频繁；调大`bucket_size`或开启通信 overlap 可以显著提升MFU。

- **代码示例:**
```python
# DeepSpeed配置文件 (ZeRO-3 Offload)
{
    "bf16": { "enabled": true },
    "zero_optimization": {
        "stage": 3,
        "offload_param": { "device": "cpu" },  # 关键：参数卸载到CPU以省显存
        "offload_optimizer": { "device": "cpu" },
        "stage3_prefetch_bucket_size": 5e8,
        "stage3_param_persistence_threshold": 1e6 # 小参数不切分，减少通信
    }
}
```

- **选择建议:**
- 模型<7B: ZeRO-1或纯DP
- 模型7B-70B: ZeRO-2
- 模型>70B: ZeRO-3 + CPU Offload

- **## 常见考点:**
1. ZeRO-3在推理时如何避免频繁的All-Gather导致延迟高？
2. ZeRO-Offload 是如何利用CPU内存和NVLink/PCIe带宽的？
3. 相比FSDP (Fully Sharded Data Parallel)，ZeRO有哪些异同？
