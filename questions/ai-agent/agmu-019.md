---
id: agmu-019
difficulty: L2
category: ai-agent
subcategory: 多智能体系统
tags:
- IO
- IOC
feynman:
  essence: 单 Agent 是工具调度器，多 Agent 是协作组织。
  analogy: 单 Agent 是瑞士军刀，多 Agent 是专家组。
  first_principle: 如何根据任务复杂度选择系统架构模式？
  key_points:
  - 单Agent：统一策略，简单工具调用
  - 多Agent：角色隔离、并行、对抗
  - 选择：任务简单用单Agent
  - 复杂：需组织流程用多Agent
memory_points:
- 单 Agent 适合简单任务，上下文连贯成本低。
- 多 Agent 适合需角色隔离、并行处理或对抗评审的复杂任务。
- 避免过度设计，简单任务勿增实体。
---

# 多 Agent 与「单 Agent + 多个工具」取舍

若任务只需统一策略按序调用不同 API，单 Agent + 工具调度即可，架构简单、上下文连贯、成本低；若任务复杂，需要角色隔离（如分别设程序员、产品经理、测试员）、并行处理（多线程执行子任务）、对抗评审（红蓝军对抗）或复杂的组织流程协作，多 Agent 架构更合适。

**架构对比**：
```text
【单 Agent + 工具模式】
┌─────────────┐
│   单 Agent  │◄────┐
│ (大脑+调度)  │     │ 上下文
└──────┬──────┘     │ 共享
       │           │
  ┌────┴────┬────┐   │
  ▼         ▼    ▼   ▼
 Tool1    Tool2 ToolN

【多 Agent 模式】
┌─────────┐  消息总线  ┌─────────┐
│ Agent A │◄────────►│ Agent B │
│(写代码)  │  (解耦/   │(测试员)  │
└─────────┘   异步)   └─────────┘
    │                       │
    ▼                       ▼
┌─────────┐            ┌─────────┐
│  Tool   │            │  Tool   │
└─────────┘            └─────────┘
```

**实战案例**：
初期构建文档生成器时使用单 Agent，它既能查 API 又能写 Markdown，但当文档篇幅超过 2000 tokens 时，它经常忘记开头定义的术语。改为多 Agent（Searcher 专注查资料，Writer 专注写作，Editor 专注校对）后，文档结构一致性提升明显，且查资料与写作可并行，耗时缩短 30%。

**代码示例**：
```python
# Pseudo-code for Multi-Agent dispatch
from typing import Literal

def dispatch_task(task_type: str) -> str:
    # 单 Agent 简单逻辑
    if task_type == "simple_query":
        return single_agent_with_tools.run(task_type)
    
    # 多 Agent 协作逻辑
    agents = {
        "coder": CodeAgent(),
        "reviewer": ReviewerAgent()
    }
    
    # 1. Coder generates code
    code_result = agents["coder"].run(task_type)
    
    # 2. Reviewer validates (并行或串行)
    review = agents["reviewer"].run(code_result)
    
    return review.final_output
```

**架构选型对比**：

| 维度 | 单 Agent + Tools | 多 Agent 系统 |
| :--- | :--- | :--- |
| **上下文连贯性** | 高 (单一 Memory) | 中 (需共享/同步 Memory) |
| **Token 成本** | 低 (一次 Prompt) | 高 (多次交互 + 解析) |
| **扩展性** | 低 (加工具需重训 Prompt) | 高 (加 Agent 无需改动现有) |
| **容错能力** | 差 (一处错全盘输) | 好 (单个 Agent 失败可重试/降级) |
| **适用场景** | FAQ、简单指令执行 | 软件开发、复杂流程审批 |

## 常见考点
1. **通信成本**：多 Agent 间消息传递会造成大量 Token 消耗，如何优化？（如消息摘要、共享记忆库）。
2. **环路控制**：多 Agent 容易陷入无限对话循环，如何设置终止条件？（如最大轮数、裁判 Agent 打分）。
3. **一致性**：多 Agent 对同一事实的理解不一致时，如何解决？（通过共享知识库或仲裁 Agent）。

## 易错点
1. **过度设计**：对于简单的“查询 + 格式化”任务引入多 Agent，导致延迟成倍增加且调试困难。应遵循“Occam's Razor”（如无必要，勿增实体）。
2. **消息传递噪声**：在多 Agent 对话中，过多冗余的寒暄或重复信息会挤占宝贵的 Context Window。应规定 Agent 间使用结构化数据（如 JSON）而非自然语言进行高效通信。

## 面试追问
1. 随着任务复杂度提升，如何动态决定是启用单 Agent 还是多 Agent？（提示：引入 Router Agent 评估任务复杂度）。
2. 在多 Agent 系统中，如何处理“慢速 Agent”拖垮整体响应速度的问题？（提示：设置超时机制、异步并行或热备份 Agent）。
3. 你提到了“角色隔离”，如何防止不同 Agent 的 Prompt 之间产生冲突或指令泄露？

## 记忆要点

- 单 Agent 适合简单任务，上下文连贯成本低。
- 多 Agent 适合需角色隔离、并行处理或对抗评审的复杂任务。
- 避免过度设计，简单任务勿增实体。

