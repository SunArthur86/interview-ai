---
id: agmu-011
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: 将协作结构显式化以降低 Prompt 编程的复杂度。
  analogy: 像把口头分工变成了可视化的组织架构图。
  first_principle: 如何将隐式的协作逻辑转化为可管理的显式结构？
  key_points:
  - 抽象：角色、任务、依赖为一等公民
  - 价值：结构可见可复用
  - 简化：降低Prompt负担
  - 局限：权限边界需手动把控
---

# CrewAI 的「Crew」抽象解决什么问题

CrewAI 的「Crew」抽象本质上是将 **「角色分工 + 任务依赖 + 执行顺序」** 从散乱的 Prompt 工程中抽离出来，变成一等公民。它定义了一组 Agent（角色）如何协作完成一组 Task（任务），降低了「写一大坨 system prompt」的心智负担，让协作结构可见、可复用。

**架构抽象图**：
```text
      [ Crew (Process Manager) ]
      /          |           \
   Agent1      Agent2       Agent3
   (Coder)   (Reviewer)   (Writer)
      |           |           |
      v           v           v
   Task1 <---- Task2 <---- Task3
 (Create)   (Review)    (Finalize)
      |           |           |
      └───────────┴───────────┘
                  │
           [ Sequential Process ]
           (Hierarchical also avail)
```

**关键细节补充**：
- **Process（流程）**：Crew 默认支持 `sequential`（顺序执行）和 `hierarchical`（层级管理，有一个 Manager Agent 分发任务）。
- **Task 属性**：每个 Task 可以指定 `description`（用于 LLM 理解）、`expected_output`（用于格式化输出）以及具体的 `agent`。通过 Context 机制，前一个任务的输出可以自动传递给下一个任务。
- **Tools 集成**：虽然结构化了，但工具权限还是挂载在具体的 Agent 实例上，Crew 本身不提供工具沙箱，依赖 Agent 自身的工具定义。

**追问应对**：若问缺点？答：抽象与真实权限/数据边界仍需自己把控；复杂分支可能要下沉到代码，Crew 的流程编排能力相比 LangGraph 的图结构较弱。

## 常见考点
1. **进程模式**：`Sequential` 和 `Hierarchical` 的适用场景？（答：简单流水线用 Sequential，需要动态调度或复杂分解用 Hierarchical）。
2. **内存共享**：不同 Agent 之间如何共享上下文？（答：主要通过 Task 的输出作为下一个 Task 的输入，或者共享短期记忆）。
3. **执行机制**：CrewAI 是并行的吗？（答：默认 Sequential 是串行的，Hierarchical 中 Manager 可以并发派发，但需注意 LLM API 调用的并发限制）。
