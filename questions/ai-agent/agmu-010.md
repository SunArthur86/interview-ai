---
id: agmu-010
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: AutoGen 重对话流，LangGraph 重状态流转。
  analogy: AutoGen 像聊天群组，LangGraph 像工作流引擎。
  first_principle: 如何选择适合交互逻辑与工程控制的抽象框架？
  key_points:
  - AutoGen：多角色对话，快速组合
  - LangGraph：状态机，易审计
  - 侧重：AutoGen偏探索，LangGraph偏生产
  - 混用：节点嵌套，统一追踪
---

# AutoGen 和 LangGraph 多 Agent 有什么气质差异

**核心气质差异**：
AutoGen 偏重于「对话式」与「多角色社交」的快速组合，采用类似聊天的消息传递机制，Agent 之间通过自然语言或结构化消息进行「回合制」交互，适合模拟人类协作、谈判或人机混合探索。
LangGraph 偏重于「确定性」与「状态机」的显式定义，采用图结构将节点和边代码化，内置 Checkpointer（检查点）支持时间旅行和状态回滚，适合需要严格流程控制、长链路恢复和审计的生产环境。

**架构与交互对比图**：
```text
[ AutoGen 模式 ]           [ LangGraph 模式 ]

  User ─┐                    ┌─────┐
       │                    │Start│
  ┌────▼────┐ Msg1         └──┬──┘
  │ Agent A ├──────────┐      │ (Graph Edges)
  └────┬────┘          │      ▼
       │ Msg2          │   ┌───────┐     Transition
  ┌────▼────┐          └──▶│ Node A├──────────────▶
  │ Agent B │◀─────────────┤(LLM)  │     (Next Step)
  └────┬────┘  Msg3        └───┬───┘
       │                      │   (State Update)
       │                      ▼
  Result?                ┌────────┐
                         │ Check  │ (Persist State)
                         │ Point  │
                         └────────┘
```

**细节补充**：
- **AutoGen**：核心是 `ConversableAgent`，支持 `human_input_mode` 中断。状态通常隐含在对话历史中，恢复较难，天然适合 RAG 问答、代码助手等探索场景。
- **LangGraph**：核心是 `StateGraph`，必须有明确的 `TypedDict` 定义状态。每个节点是一个纯函数 `(state) -> new_state`，边可以包含条件分支。其 checkpoint 机制（基于 Redis/Postgres/S3）允许流程中断后从任意节点恢复。

**追问应对**：若问「能混用吗？」——答：可以，例如 LangGraph 节点内嵌 AutoGen 会话，利用 AutoGen 处理复杂的角色对话，利用 LangGraph 控制总体流程和状态持久化，但要统一 trace id 与成本核算。

## 常见考点
1. **状态管理**：LangGraph 的状态如何在节点间流转？（答：通过共享的 `State` 对象，每次节点返回更新部分，Graph 会合并）。
2. **循环控制**：AutoGen 如何防止无限对话？（答：通常通过设置 `max_consecutive_auto_reply` 参数）。
3. **人机协作**：两者如何介入人工审核？（答：AutoGen 通过中断机制，LangGraph 通过特定的 interrupt 节点或边）。
