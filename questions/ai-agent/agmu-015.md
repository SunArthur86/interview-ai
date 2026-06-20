---
id: agmu-015
difficulty: L1
category: ai-agent
subcategory: 多智能体系统
feynman:
  essence: 通过沙箱、校验和检查点限制错误传播范围。
  analogy: 危险操作在隔离室做，出门过安检，坏了回退到上个存档点。
  first_principle: 如何在开放执行环境中保障系统稳定性与安全性？
  key_points:
  - 沙箱：最小权限，隔离执行
  - 校验：Agent门禁检查
  - 检查点：失败回滚重试
  - 数据：大对象传句柄
---

# 错误隔离在多 Agent 里如何实现

多 Agent 系统的错误隔离需层层设防，防止一个 Agent 的错误（或恶意攻击）导致整个系统崩溃或数据泄露。
1. **沙箱执行与最小权限**：Agent 使用的工具必须遵循最小权限原则，且最好在容器沙箱中运行。
2. **校验 Agent 作为门禁**：Agent 的输出不能直接执行，需经过 Validator Agent（或 Pydantic 模型）校验。
3. **检查点机制**：通过关键节点后持久化状态，失败时从上一个安全检查点重试，而不是从头开始。
4. **参数清洗**：绝不把未经校验的自然语言直接当 API 参数，必须强制转换为结构化数据。

**错误隔离与恢复架构图**：
```text
[ Agent A ] 
      │
      ▼ (Raw Plan/Action)
┌─────────────────┐
│  Guard/Validate │ (Type Check / Safety Check)
│    Agent        │
└────────┬────────┘
         │ Pass?
         │
    No   │   Yes
    ┌────┴────┐
    ▼         ▼
[ Reject]  ┌──────────┐
            │   Tool   │ (Sandboxed Execution)
            │ Executor │
            └─────┬────┘
                  │
                  ▼ (Result)
            ┌──────────┐
            │ Checkpoint│ (Save State to DB)
            └──────────┘
```

**实战案例**：
在构建数据分析 Agent 时，曾出现 Agent 生成 `DELETE FROM table` 的恶意指令。实战中我们在 Docker 容器内挂载只读文件系统，并在 Pydantic 校验层直接拦截包含 `DROP`、`DELETE` 等高危关键词的 SQL 语句，确保即使 Agent 幻觉也无法破坏数据。

**代码示例**：
```python
from pydantic import BaseModel, validator

class SqlQuery(BaseModel):
    query: str

    @validator('query')
    def forbid_destructive_ops(cls, v):
        forbidden = {'DROP', 'DELETE', 'TRUNCATE', 'ALTER'}
        if any(word in v.upper() for word in forbidden):
            raise ValueError("Dangerous SQL operation detected")
        return v

# Mock execution guard
def execute_tool(agent_output: dict):
    try:
        validated = SqlQuery(**agent_output) # 1. 强制校验
        # 2. 沙箱执行 (实际调用 docker exec 或受限 DB cursor)
        return run_in_sandbox(validated.query) 
    except ValueError as e:
        return {"error": str(e), "action": "blocked"}
```

**技术选型对比**：

| 特性 | 虚拟机/裸机 | Docker 容器 | gVisor/Firecracker |
| :--- | :--- | :--- | :--- |
| **隔离强度** | 高 (硬件级) | 中 (内核共享) | 高 (用户态内核/微VM) |
| **启动速度** | 慢 (分钟级) | 快 (秒级) | 极快 (毫秒级) |
| **性能损耗** | 无 | 低 (~1-2%) | 中 (~5-10%) |
| **适用场景** | 物理隔离核心库 | 通用任务沙箱 | 不可信代码执行 (AI生成代码) |

**关键细节补充**：
- **沙箱技术**：对于代码执行类 Agent，可使用 Docker 容器或 gVisor，限制网络访问和文件系统读写。
- **输入验证**：使用 JSON Schema 或 Pydantic 严格约束 Agent 调用工具的参数类型。
- **Side Effect 偿偿**：如果工具调用产生了副作用（如发邮件、写库），检查点机制需要配合「补偿事务」（即回滚操作），或者将副作用操作推迟到整个流程最后一步。

**追问应对**：若问「工具返回很大怎么办？」——答：存对象存储（S3），传 URL/句柄/摘要进上下文，避免 Context 爆炸和 Token 浪费。

## 常见考点
1. **并发隔离**：多个 Agent 并发调用工具时如何隔离？（答：依赖底层工具的并发控制，或者为每个 Agent 实例分配独立的资源队列）。
2. **幂等性**：重试机制要求工具调用必须是幂等的，如何保证？（答：在工具层设计时引入 `request_id` 或业务唯一键）。
