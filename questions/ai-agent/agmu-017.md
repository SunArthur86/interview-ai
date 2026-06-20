---
id: agmu-017
difficulty: L2
category: ai-agent
subcategory: 多智能体系统
tags:
- IO
feynman:
  essence: 分层评估结合人工黄金集，避免模型评估偏差。
  analogy: 像考核员工，既要考试（单元），也要看项目成果（端到端）。
  first_principle: 如何全方位量化多智能体系统的性能表现？
  key_points:
  - 单元：单Agent输入输出
  - 集成：交互逻辑测试
  - 端到端：整体任务成功率
  - 防偏：LLM-as-judge需黄金集校准
---

# 多 Agent 的评估怎么做

多 Agent 的评估必须**分层**进行，单看最终结果往往难以定位问题。
- **单元**：单 Agent I/O。测试单个 Agent 是否根据特定 Input 给出了合理的 Output 或 Tool Call。
- **集成**：两两交互。测试 Agent A 的输出是否能被 Agent B 正确解析并执行。
- **端到端（E2E）**：任务成功率。给定一个用户 Goal，整个系统是否能以合理的成本和时间给出正确结果。

辅助手段：LLM-as-judge（用 GPT-4 当裁判），但需防偏见，最好配黄金集与人审。

**评估流程与代码示例**：
```text
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Dataset   │ ───▶ │   System     │ ───▶ │   Metrics   │
│ (Goals)     │      │   (Agents)   │      │ (Success/   │
└─────────────┘      └──────────────┘      │  Cost/Latency│
                           │               └─────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  LLM-as-a-Judge  │
                  │  (Score 1-10)    │
                  └──────────────────┘
```

**实战案例**：
在开发客服 Agent 时，单纯看最终回复准确率高达 95%，但通过 Trace 评估发现，Agent A（意图识别）多次将「退款」误判为「咨询」，导致 Agent B 不得不进行多轮反问。通过优化 Agent A 的单元评估指标，将系统平均交互轮次从 5.2 轮降至 3.1 轮，大幅降低了 Token 成本。

**代码示例**：
```python
# 防止多 Agent 评估时的死循环
import hashlib

def run_eval_with_guard(agent_step, max_steps=10):
    seen_states = set()
    for i in range(max_steps):
        action = agent_step()
        # 对 Action 指纹哈希，防止陷入死循环（如 A->B->A）
        state_hash = hashlib.md5(str(action).encode()).hexdigest()
        if state_hash in seen_states:
            return {"status": "failed", "reason": "loop_detected"}
        seen_states.add(state_hash)
    return {"status": "completed", "steps": i}
```

**评估维度对比**：

| 维度 | 单元测试 | 集成测试 | E2E (Golden Set) |
| :--- | :--- | :--- | :--- |
| **评估对象** | 单个 Agent | Agent 交互对 | 完整工作流 |
| **核心指标** | Function Call 正确率 | 消息解析成功率 | 任务完成率 / 总耗时 |
| **故障定位** | 极快 | 中等 | 慢 (需 Trace) |
| **成本** | 低 | 中 | 高 (消耗大量 Token) |

**关键细节补充**：
- **Tracing**：必须使用分布式追踪（如 LangSmith, Arize），可视化每一步的 Token 消耗和中间状态。
- **Golden Set**：构建高质量的标准问题集，覆盖常见路径和边界情况。
- **Hallucination Rate**：专门检测 Agent 是否虚构了工具或参数。

**增强后的代码逻辑（去重与熔断）**：
```python
from typing import Callable, Any, Set, List
import hashlib

def run_with_guard(
    agent_step: Callable[[List[str]], str], 
    user_goal: str, 
    max_steps: int = 20,
    state_window: int = 5  # 防止周期性循环的窗口大小
):
    transcript: List[str] = []
    # 使用固定大小的列表作为滑动窗口，避免内存无限增长
    seen_hashes: Set[str] = set()
    history_buffer: List[str] = []

    for step in range(max_steps):
        # 构造上下文，包含历史记录
        current_context = transcript + [f"GOAL: {user_goal}"]
        
        # 执行 Agent 步骤
        action = agent_step(current_context)
        
        # 生成状态哈希 (仅对 Action 进行哈希，忽略 Context 变化)
        # 增加步骤索引防止不同步骤相同内容被误判
        action_hash = hashlib.md5(action.strip().encode()).hexdigest()
        
        # 检查是否在窗口内重复
        if action_hash in seen_hashes:
            raise RuntimeError(f"Detected repeated action at step {step}; aborting. Action: {action}")
        
        seen_hashes.add(action_hash)
        transcript.append(action)
        
        # 简单的终止条件检测
        if "<DONE>" in action:
            break
