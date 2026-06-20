---
id: agmu-007
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: 稳定流程走 Pipeline，探索任务走动态调度。
  analogy: 流水线生产标准品，特种部队执行动态任务。
  first_principle: 如何适应不同确定性程度的任务处理需求？
  key_points:
  - Pipeline：稳定SOP，契约清晰
  - 动态：探索性，可分叉
  - 混合：主干加动态分支
  - 控制：白名单与预算约束
---

# 动态任务分配和固定 Pipeline 各适合什么场景

### 动态任务分配和固定 Pipeline 各适合什么场景

**固定 Pipeline 适合**：
- **SOP (标准作业程序) 稳定**：业务逻辑清晰，步骤固定。
- **输入输出契约清晰**：每个阶段的数据形态转换明确（如：用户输入 -> SQL 生成 -> 执行 -> 结果总结）。
- **高吞吐与可预测性**：如内容审核流水线、ETL 流程。

**动态任务分配适合**：
- **探索性任务**：如故障排查、科研分析，前一步的输出决定了下一步需要做什么（可能分支，可能新增子任务）。
- **非结构化复杂问题**：无法预先定义所有步骤。
- **多路径并发**：Boss 派发多个 Worker 并行尝试不同路径，谁先解出来用谁的。

**工程实践**：
常混合使用：**主干是 Pipeline**（保证基本流程），**关键节点插入动态分配**（如某个步骤需调用工具链或进行复杂的子任务搜索）。

**实战案例**：
在一个自动化运维系统开发中，最初使用固定 Pipeline 处理报错，但面对未知故障时经常卡在“重启服务”这一步死循环。后来引入动态分配，Boss Agent 根据报错日志动态生成任务（如“查看磁盘”、“检查内存”），才成功解决了 0-day 故障的排查难题。

**代码示例**：
```python
# Python: 动态任务分配示例
def boss_agent(issue):
    tasks = []
    if "network" in issue:
        tasks.append({"task": "check_ping", "target": issue["host"]})
    if "disk" in issue:
        tasks.append({"task": "check_disk_space", "target": issue["host"]})
    
    # 并行执行
    results = run_parallel(tasks)
    return synthesize_results(results)
```

**架构对比**：
```
Fixed Pipeline:          Dynamic Allocation:
Step1 -> Step2 -> Step3       Boss
         │                      │
         ▼               ┌──────┴──────┐
      Step4          Worker1   Worker2   Worker3
                       (Plan A)  (Plan B)  (Plan C)
```

**追问应对**：
若问「动态会不会不可控？」——答：是的。风险包括循环生成任务、无限递归、成本失控。需要设置**预算**（最大步数/Token）、**最大深度**、**工具白名单**以及**人类在环**确认关键决策。

## 常见考点
1. **动态分配中的 Task 怎么描述？**
   答：通常使用结构化描述，包含 `Task ID`, `Dependencies`, `Context`, `Expected Output Format`。
2. **如何处理动态分配中的失败？**
   答：如果某条路径失败，Boss 需评估是否有其他路径可行，或者是否需要调整策略重新生成任务，而不是简单的报错终止。
