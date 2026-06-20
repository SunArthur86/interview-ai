---
id: misc-021
difficulty: L2
category: ai-basics
subcategory: 推理优化
images:
- svg_beam_search.svg
feynman:
  essence: 调节随机性与确定性的平衡，控制生成内容的多样性与质量。
  analogy: 调温水龙头，温度低就是固定的冷水，温度高就是随机混搭的热水。
  first_principle: 如何在模型生成的确定性与创造性之间找到最佳平衡点？
  key_points:
  - Temperature控制输出随机平滑度
  - Top-k限制候选词数量
  - Top-p限制累积概率质量
  - 通常组合使用Temp+Top-p
follow_up:
- 为什么Temperature=0不等于确定性输出?
- repetition_penalty如何影响生成质量?
---

# Temperature、Top-p、Top-k采样策略各自的作用?如何组合使用

- **采样策略:**

| 策略 | 作用 | 推荐值 | 适用场景 |
|------|------|--------|---------|
| Temperature | 控制随机性,T越低越确定 | 代码0.1/创意0.7 | 逻辑任务 vs 创作任务 |
| Top-k | 只从概率最高的k个token中采样 | k=40 | 过滤极低概率噪声 |
| Top-p (Nucleus) | 从累积概率超过p的最小token集中采样 | p=0.9 | 动态截断长尾 |

- **原理深度解析:**
  - **Temperature (温度)**: 在 Softmax 之前对 Logits 进行缩放。公式：$Softmax(\frac{logits}{T})$。
    - $T \to 0$: 概率分布趋于尖锐（One-hot），接近贪婪搜索，确定性高。
    - $T > 1$: 概率分布趋于平坦，随机性增加，容易产生创造性但也容易产生幻觉。
  - **Top-k**: 将概率低于第 $k$ 大 token 的所有 token 概率强制置 0，然后重新归一化。限制了候选集的大小，防止低概率的"噪声"词被选中。
  - **Top-p**: 从概率高到低累加，一旦累加和超过 $p$，则截断，剩余 token 概率置 0 并重归一化。它保证了候选集的概率质量，动态调整候选数量（有时是 1 个，有时是 100 个）。

- **采样流程图:**

```
Raw Logits (Model Output)
      │
      ▼
[ Divide by Temperature ] ──> 调整分布平滑度
      │
      ▼
[ Softmax ] ──> 得到概率分布 P
      │
      ▼
[ Filter: Top-k & Top-p ] ──> 剔除低概率 Token
  (例如: 只保留累积概率 > 0.9 的最小集合)
      │
      ▼
[ Re-normalize ] ──> 重新归一化概率和为 1
      │
      ▼
[ Sample ] ──> 根据最终概率采样 Token
```

- **组合建议:** 
  - **Temperature + Top-p**: 工业界最常用组合。Temperature 负责整体风格，Top-p 负责截断长尾噪声。
  - **代码/数学**: T=0.1 (甚至 0), p=0.95 (截断轻微误差)。逻辑任务希望结果确定。
  - **创意写作**: T=0.7 (引入随机性), p=0.9 (允许一定的多样性)
  - **注意**: Top-k 和 Top-p 通常同时开启，起到"双重保险"作用。例如设置 Top-k=40, Top-p=0.9，意味着取两者较小的集合。

- **实战案例:**
在构建代码生成助手时，初始设置 Temperature=0.7 导致生成的代码片段语法错误率高且包含幻觉API。将 Temperature 调整至 0.1 并开启 Top-p=0.95 后，编译通过率从65%提升至92%，有效减少了非确定性输出带来的风险。

- **代码示例:**
```python
import torch
import torch.nn.functional as F

def sample_with_strategy(logits, temperature=0.7, top_k=40, top_p=0.9):
    # 1. Temperature Scaling
    logits = logits / temperature
    
    # 2. Softmax
    probs = F.softmax(logits, dim=-1)
    
    # 3. Top-k Filtering
    values, indices = torch.topk(probs, top_k)
    # 创建全零mask，只保留top_k位置
    probs_top_k = torch.zeros_like(probs)
    probs_top_k.scatter_(1, indices, values)
    
    # 4. Top-p (Nucleus) Filtering
    sorted_probs, sorted_indices = torch.sort(probs_top_k, descending=True)
    cumulative_probs = torch.cumsum(sorted_probs, dim=-1)
    
    # 移除累积概率超过p的token
    sorted_indices_to_remove = cumulative_probs > top_p
    # 保留至少一个token
    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
    sorted_indices_to_remove[..., 0] = 0
    
    # 将移除的token概率置0
    probs_top_p = probs_top_k.scatter(1, sorted_indices, sorted_probs)
    probs_top_p[sorted_indices_to_remove] = 0.0
    
    # 5. Re-normalize
    probs_top_p = probs_top_p / probs_top_p.sum(dim=-1, keepdim=True)
    
    # 6. Sample
    next_token = torch.multinomial(probs_top_p, num_samples=1)
    return next_token
```

- **## 常见考点**
  1. **Temperature = 0 的实现问题**: 理论上 $T=0$ 会导致除以零。实际代码中通常直接取 `argmax` (贪婪搜索) 而不是经过 Softmax 采样，或者设置一个极小值。
  2. **Top-p vs Top-k 的边界**: Top-p 在分布非常平坦时可能保留过多的 token（计算量大），而 Top-k 严格限制了数量。在分布非常尖锐时，Top-p 可能只保留 1 个 token，此时退化为贪婪搜索。
  3. **Repetition Penalty (重复惩罚)**: 这虽然不是采样策略，但常与上述参数配合使用。通过在 Softmax 前对已生成 token 的 logits 进行惩罚（除以 penalty 或减去常数），避免模型循环复读。
