---
id: agmu-003
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: 通过隔离失败域和重试机制提升系统鲁棒性。
  analogy: 流水线坏了一个工人，只停那条线，整间工厂不倒闭。
  first_principle: 如何构建具备高可用性的容错协作系统？
  key_points:
  - 隔离：单点失败不污染全局
  - 替换：失败步骤可独立重试
  - 配合：重试、断路器、降级
  - 治理：仲裁机制防止推诿
---

# 多 Agent 的「容错」具体怎么体现

### 多 Agent 的「容错」具体怎么体现

**核心体现**：失败隔离 + 可替换性。

**具体机制**：
- **失败隔离**：例如审查 Agent 发现实现 Agent 的代码不合规，可打回重写而不污染主对话上下文，避免错误传播。
- **沙箱隔离**：执行 Agent 运行代码在沙箱中，崩溃仅导致该任务失败，不影响调度器或其他 Agent。
- **状态回滚**：基于状态机的系统可在某步骤失败时回滚到上一个稳定状态。

**工程配套设施**：
- **重试策略**：指数退避重试，处理瞬时网络或模型 jitter 错误。
- **断路器**：当某个 Agent 连续失败 N 次，暂停调用，防止 Token 浪费和系统雪崩。
- **降级模板**：Agent 无响应时，返回预设的安全兜底回复。

**架构示意图**：
```
┌─────────────┐
│  Scheduler  │
└──────┬──────┘
       │ (Assign Task)
       ▼
┌─────────────┐     Fail      ┌──────────────┐
│  Agent A    │──────────────▶│  Retry Logic │
│  (Executor) │◀──────────────│ (Circuit Brk)│
└──────┬──────┘   Retry       └──────────────┘
       │ Success
       ▼
┌─────────────┐
│  Agent B    │
│  (Reviewer) │
└─────────────┘
```

**追问应对**：
若问「会不会互相甩锅？」——答：会。解决方案包括：明确每个 Agent 的输入输出契约、引入主席/仲裁机制裁决、记录全过程可观测日志用于事后定责。

### 深化实战
- **实战案例**：在生产环境中，API 解析 Agent 偶发因格式变化崩溃。由于没有熔断机制，导致下游调用该 Agent 的主流程不断重试，单小时消耗数千美元成本。后增加“失败计数器”，超过 3 次直接跳过该步骤返回默认值。
- **代码示例（Python - 带熔断的重试）**：
```python
from tenacity import retry, stop_after_attempt, wait_exponential

class CircuitBreaker:
    def __init__(self, threshold=3):
        self.fail_count = 0
        self.threshold = threshold
    
    def call_agent(self, agent_func, *args):
        if self.fail_count >= self.threshold:
            return "Fallback Response: Service Unavailable"
        try:
            res = agent_func(*args)
            self.fail_count = 0 # Reset on success
            return res
        except Exception:
            self.fail_count += 1
            raise
```

## 常见考点
1. **断路器在 Agent 系统中的参数怎么设置？**
   答：通常根据任务耗时和成本设定，例如连续 3 次超时或 5 次幻觉错误即熔断，熔断持续时间设为 1-5 分钟。
2. **如何处理部分成功的情况？**
   答：使用事务脚本或 Saga 模式，定义补偿操作，例如 Agent A 写入了数据但 Agent B 审核失败，需触发 Agent A 的回滚接口。
