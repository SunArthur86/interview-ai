---
id: agmu-009
difficulty: L2
category: ai-agent
subcategory: 多智能体系统
tags:
- IOC
- Redis
feynman:
  essence: 状态机提供可观测和可验证的执行骨架。
  analogy: 用流程图管进度，比纯口头交代靠谱。
  first_principle: 如何在复杂交互中保证执行逻辑的可控与可观测？
  key_points:
  - 自然语言：灵活但难测试、难观测
  - 状态机：可验证、可回放
  - 作用：状态机是骨架，自然语言是附件
  - 存储：生产环境需外部存储
---

# 多 Agent 系统为什么推荐状态机而不是纯自然语言传递一切

### 多 Agent 系统为什么推荐状态机而不是纯自然语言传递一切

**原因分析**：
- **可测试性与可回放**：自然语言非结构化，难以编写单元测试。状态机状态明确，输入确定，易于 Mock 和回溯。
- **可观测性**：当系统卡住或出错时，状态机能清晰指示「卡在 `WAITING_FOR_APPROVAL` 状态多久了」，而自然语言需要人工阅读日志分析。
- **防止跑偏**：LLM 倾向于发散，状态机限制了合法的状态转移路径，提供**护栏**。
- **明确终止**：自然语言对话容易无限循环，状态机定义了明确的终态。

**实战案例**：
早期开发客服 Agent 时，完全依赖 LLM 理解对话意图判断是否转人工，导致用户一直在“正在为您转接”和“请继续描述问题”之间无限循环。后来引入状态机，定义 `TRIAGE` -> `SOLVING` -> `ESCALATING` 的严格流转，一旦进入 `ESCALATING` 状态，LLM 仅被允许输出固定话术并调用 API，彻底解决了死循环问题。

**代码示例**：
```python
# Python: 简单的状态机流转控制
class AgentStateMachine:
    def __init__(self):
        self.state = "IDLE"
        self.transitions = {
            "IDLE": ["PROCESSING"],
            "PROCESSING": ["DONE", "ERROR", "HUMAN_REVIEW"],
            "HUMAN_REVIEW": ["PROCESSING", "DONE"]
        }

    def transition(self, new_state):
        if new_state in self.transitions[self.state]:
            self.state = new_state
            return True
        return False # 非法流转，拒绝
```

**架构对比**：
```
纯自然语言 (乱序, 隐式):        状态机 (有序, 显式):
[Chat History]                [State Machine]
 1. User: Do X                   ┌───────┐
 2. Agent A: Ok...     Idle ──▶ │  Run  │
 3. Agent B: Wait...             └───┬───┘
 4. Agent A: Sorry...     ▲         │
 5. ...                  │         ▼
 (难追踪状态)           Error  ──▶ Done
```

**工程实践**：
- 自然语言内容应作为状态机的**附件/上下文**存储，而非驱动逻辑的唯一依据。
- 状态流转通常由LLM根据当前上下文输出特定的指令或标签来触发。

**追问应对**：
若问「状态存在哪？」——答：进程内内存只适合 Demo；生产环境推荐使用 Redis（高性能、支持过期）或数据库（持久化、可审计），并配合乐观锁（CAS）解决并发修改冲突。

## 常见考点
1. **状态机的状态如何设计粒度？**
   答：不宜过细（导致频繁持久化开销大）也不宜过粗（失去控制力）。通常对应业务流程的关键里程碑（如：Input -> Processing -> Review -> Finished）。
2. **如何处理状态机中的死锁？**
   答：设置每个状态的 TTL（超时时间），超时后自动转入错误状态或触发人工介入流程。
