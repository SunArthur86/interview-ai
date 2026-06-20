---
id: agmu-005
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: 设置硬约束和结构化发言防止无休止讨论。
  analogy: 会议必须有议程表和超时闹钟。
  first_principle: 如何在多轮对话中避免无效循环与资源空耗？
  key_points:
  - 终止：最大轮数、Token预算、无新信息阈值
  - 裁决：主席或规则引擎
  - 结构：观点+证据，减少废话
  - 适用：创意或低风险场景
---

# 民主讨论模式如何避免永远开不完会

### 民主讨论模式如何避免永远开不完会

**问题核心**：
多 Agent 讨论若无约束，容易陷入死循环或无意义的废话堆砌，导致 Token 耗尽且无产出。

**硬终止条件**：
1. **最大轮数限制**：如限制讨论不超过 5 轮。
2. **Token 预算**：设置总消耗上限或单轮上限。
3. **收敛阈值**：检测 Agent 观点的相似度（如 Embedding Cosine Similarity > 0.95）或连续两轮无实质变更。
4. **主席/裁决机制**：引入 Moderator Agent，根据规则强制结束。

**软优化策略**：
- **结构化发言**：强制 Agent 输出格式为 `{观点, 证据, 反对意见}`，减少自然语言废话。
- **沉默机制**：如果某 Agent 无新观点，允许输出 `PASS`。

**实战案例**：
在某代码审查系统中，两个 Agent 对代码风格陷入无限争论，导致上下文膨胀。引入「投票+Token预算」双重熔断后，若 3 轮内无法达成一致且消耗超过 5000 tokens，系统自动强制调用更高级别的 LLM 进行仲裁，避免资源空耗。

**代码示例**：
```python
# Python: 检查讨论是否陷入死循环
import numpy as np

def is_stagnating(current_summary, history, threshold=0.95):
    if not history: return False
    last_vec = np.array(history[-1]['embedding'])
    curr_vec = np.array(current_summary['embedding'])
    # 计算余弦相似度，若过高则视为无新观点
    similarity = np.dot(last_vec, curr_vec) / (np.linalg.norm(last_vec) * np.linalg.norm(curr_vec))
    return similarity > threshold
```

**流程图**：
```
Start Discussion
      │
      ▼
┌─────────────┐
│ Agents Speak│◀─────────────┐
└──────┬──────┘              │
       │                     │
       ▼                     │
┌─────────────┐    No        │
│ Consensus? │───────────────┤ (Max Rounds & Budget)
└──────┬──────┘              │
  Yes   │                     │
       │                     │
       ▼                     │
   Output Result            │
       │                     │
       └─────────────────────┘ (Stop/Terminate)
```

**追问应对**：
若问「讨论适合生产吗？」——答：适合低风险创意类（头脑风暴）或人类在环辅助决策；纯自动高风险决策通常不建议直接用讨论，需配合仲裁机制 + 确定性规则引擎。

## 常见考点
1. **如何判定“无新信息”？**
   答：对比当前轮次与上一轮次的摘要向量，或计算新增信息熵，若低于阈值则判定为停滞。
2. ** Moderator Agent 的职责是什么？**
   答：控场（不跑题）、计时（防止超时）、总结（归纳分歧点）和最终拍板。
