---
id: agmu-004
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: Pipeline 重顺序，Boss-Worker 重动态调度。
  analogy: Pipeline 是固定传送带，Boss-Worker 是灵活的派单中心。
  first_principle: 如何平衡任务执行的确定性与灵活性？
  key_points:
  - Pipeline：固定阶段，顺序执行
  - Boss-Worker：动态图，并行派发
  - 混合：Boss定阶段，内部跑Pipeline
  - 差异：确定性 vs 灵活性
---

# Boss-Worker 和 Pipeline 有什么本质差异

### Boss-Worker 和 Pipeline 有什么本质差异

**本质差异**：
- **Pipeline (流水线)**：强调**固定的阶段顺序**与**数据形态转换**。数据必须流经 Stage A -> B -> C，每个 Stage 处理不同形态的数据（如：文本 -> AST -> 代码）。
- **Boss-Worker (主从)**：强调**动态任务图**。Boss 负责任务分解、分发和聚合，Workers 是无状态的执行者。Boss 可按需增删子任务、并行派发，路径不一定线性。

**形象比喻**：
- **Pipeline** 更像工厂流水线，每个工位做一道工序。
- **Boss-Worker** 更像项目经理排期，经理派活给组员，组员干完汇总。

**架构对比图**：
```
Pipeline (线性):         Boss-Worker (动态):
Input ──▶ [A] ──▶ [B] ──▶ Output      [Boss]───────┐
   │        │        │                 │  (Dispatch)
   ▼        ▼        ▼                 ▼            ▼
[A fixed] [B fixed] [C fixed]      [Worker 1]   [Worker 2]
                                      (Task X)    (Task Y)
                                           │           │
                                           └─────┬─────┘
                                                 ▼
                                             [Result]
```

**对比表格**：
| 维度 | Pipeline (流水线) | Boss-Worker (主从) |
| :--- | :--- | :--- |
| **控制逻辑** | 集中式/硬编码流程 | 中心化调度(动态决策) |
| **依赖关系** | 强依赖（Stage N 依赖 N-1 输出） | 弱依赖（Worker 间通常独立） |
| **并行度** | 受限于最长 Stage | 高度并行（Worker 水平扩展） |
| **适用场景** | ETL、标准化审核流程 | 数据处理、分布式爬虫、弹性任务 |

**追问应对**：
若问「能混合吗？」——答：非常常见。宏观上是 Boss 架构，Boss 定义好阶段，每个阶段内部跑 Pipeline；或者 Boss 动态插入节点，节点间同步执行。

### 深化实战
- **实战案例**：在开发文档生成系统时，最初用 Pipeline（提取->转写->生成），只要提取失败，后续全挂。后改为 Boss 模式，Boss 针对不同类型的文档分发给不同的 Worker 专精处理，某 Worker 挂了只影响那一类文档，整体可用性提升。
- **代码示例（Python - Boss 逻辑）**：
```pythonnclass BossAgent:
    def dispatch(self, task):
        # 根据任务动态分配，而非固定链条
        if task.type == 'simple':
            return WorkerA().run(task) # 走快速通道
        elif task.type == 'complex':
            # 并行调用多个 Worker 汇总
            res1 = WorkerB().run_async(task)
            res2 = WorkerC().run_async(task)
            return aggregate(res1, res2)
```

### ## 常见考点
1. **Pipeline 的背压如何处理？**
   答：在 Agent 语境下通常体现为队列积压，需限制并发数或丢弃低优先级任务，防止上下游速度不匹配导致资源耗尽。
2. **Boss-Worker 模式中 Worker 的输出格式如何统一？**
   答：必须强类型约束（如 Pydantic Model），否则 Boss 难以解析结果进行下一步决策。
