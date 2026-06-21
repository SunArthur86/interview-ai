---
id: ai-scen-009
difficulty: L3
category: ai-scenario
subcategory: AI Agent系统设计
tags:
- 多Agent
- Agent协作
- 任务编排
- LangGraph
- CrewAI
- DAG
feynman:
  essence: 通过角色分工和协作机制，让多个AI Agent像团队一样协同完成复杂任务。
  analogy: 像公司项目组，有PM分配任务，有程序员写代码，有测试找Bug，最后大家一起交付。
  first_principle: 如何让多个独立智能体高效协作，共同解决单一智能体无法完成的复杂问题？
  key_points:
  - 明确角色分工，编排者负责任务分解与分发。
  - 采用黑板或消息传递模式处理通信。
  - 使用DAG图管理任务依赖和并行执行。
  - 设置超时和最大轮次防止死循环。
follow_up:
- 多Agent之间的上下文如何高效共享而不爆炸？
- 如果某个Agent给出错误结果，如何防止错误传播？
- 如何评测多Agent系统的端到端效果？
---

# 如何设计一个多Agent协作系统？例如多个AI Agent协同完成一个复杂的数据分析报告。

【场景分析】
多Agent协作核心挑战：任务分解、Agent间通信、结果聚合、错误传播控制、死锁检测。

**实战案例**：在构建自动化投研系统时，我们将研究员、数据分析师和报告撰写者设为独立Agent。曾遇到过Analyst Agent因为数据格式异常陷入重试死循环，导致整个系统挂起。引入Review Agent作为监控者检测心跳，并设置超时熔断机制后才解决。

【架构设计】
1. Agent角色定义：
   - Orchestrator（编排者）：接收任务 → 分解子任务 → 分配 → 聚合结果
   - Researcher（研究员）：收集数据、查询数据库、调用API
   - Analyst（分析师）：数据清洗、统计分析、生成图表
   - Writer（撰写者）：整合分析结果、撰写报告
   - Reviewer（审核者）：质量检查、事实核查
2. 通信模式：
   - 共享黑板：Agent读写共享状态空间（适合解耦，但可能产生竞争）
   - 消息传递：Agent间直接通信（如点对点，适合明确流程）
   - 事件驱动：任务完成事件触发下一步（适合异步松耦合）
3. 任务编排：
   - DAG任务图：任务依赖关系建模
   - 串行/并行混合：独立任务并行，有依赖的串行
   - 动态分配：根据Agent能力和负载动态调度

**代码示例**：
```python
def orchestrator_loop(task, max_steps=10):
    context = {"goal": task, "history": []}
    for _ in range(max_steps):
        # 1. Router决定下一步动作
        action = router_agent.decide(context)
        if action.type == "FINAL":
            return context["result"]
        
        # 2. 执行对应Agent
        result = execute_agent(action.agent_name, action.input)
        
        # 3. 更新共享状态
        context["history"].append({"agent": action.agent_name, "output": result})
    return "Error: Max steps reached"
```

【多Agent协作状态流转图】
┌──────────────┐
│   User Query │
└──────┬───────┘
       ▼
┌──────────────┐     1. Plan      ┌───────────────────┐
│Orchestrator  ├─────────────────>│ Task Graph (DAG)  │
│  (Manager)   │                  │ [Task A, B, C...] │
└──────┬───────┘                  └─────────┬─────────┘
       │                                    │
       │ 2. Dispatch                        │ 3. Execute
       ▼                                    ▼
┌──────────────┐                   ┌──────────────────┐
│ Message Queue│<──────────────────│ Agent A / B / C  │
│  (Event Bus) │    Publish Event  │ (Workers)        │
└──────┬───────┘                   └────────┬─────────┘
       │                                    │
       │ 4. Result                          │ 5. Feedback
       ▼                                    ▼
┌──────────────┐                   ┌──────────────────┐
│ Shared State │<──────────────────│ Orchestrator     │
│ (Blackboard) │    Update State   │ (Monitor/Sync)   │
└──────────────┘                   └──────────────────┘

【协作流程示例（数据分析报告）】
用户请求 → Orchestrator分解为[收集数据, 清洗分析, 可视化, 撰写报告]
→ Researcher并行收集多源数据 → Analyst清洗+分析
→ Writer整合 → Reviewer审核 → Orchestrator返回

【关键设计决策】
- Agent数量：3-7个为宜，过多增加协调开销和通信噪音
- 上下文共享：完整共享 vs 摘要传递（避免上下文爆炸，通常传递摘要和引用ID）
- 错误隔离：单个Agent失败不阻塞全局，降级处理（如Analyst失败，Writer基于草稿撰写）
- 超时控制：每个Agent步骤设定最大执行时间，防死锁

【防止死循环】
- 最大轮次限制：max_iterations=10
- 状态追踪：检测重复动作序列（如A->B->A->B）
- 人工介入：连续失败3次或置信度低时自动升级到人工

【技术选型】
| 框架 | 核心特性 | 适用场景 |
|------|----------|----------|
| LangGraph | 有状态图（StateGraph），支持循环、边条件 | 复杂逻辑流、需精确控制步骤 |
| AutoGen | 对话式交互，支持人类介入 | 讨论、辩论类场景 |
| CrewAI | 角色扮演（Role-Play），过程驱动 | 层级分明的任务流水线 |
| Semantic Kernel | 企业级集成，Planner能力强 | 企业内部现有系统集成 |
