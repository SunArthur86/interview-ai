---
id: ai-scen-014
difficulty: L3
category: ai-scenario
subcategory: AI Agent系统设计
tags:
- 错误恢复
- 重试机制
- Checkpoint
- 降级策略
- Agent健壮性
- 异常处理
feynman:
  essence: 构建分类分级容错机制，自动检测异常并执行重试、回滚或降级操作。
  analogy: 像程序的try-catch块，遇到bug不是直接崩，而是记录日志、尝试重连或提示用户。
  first_principle: 如何在不可靠的环境中，保证Agent系统的稳定性和连续性？
  key_points:
  - 区分瞬态错误和硬错误，分别制定重试和降级策略。
  - 设置检查点保存进度，支持断点续传。
  - 检测死循环和幻觉，强制跳出或重规划。
  - 多层降级兜底，确保服务不中断。
follow_up:
- 如何设计Agent的Checkpoint频率？
- Agent死循环检测有哪些实用算法？
- 如何在不影响用户体验的情况下实现降级？
---

# 如何设计AI Agent的错误恢复机制？当Agent执行任务中途失败时，如何优雅地处理和恢复。

【场景分析】
Agent失败类型多样：工具调用失败、LLM输出格式错误、上下文超限、逻辑死循环、外部服务不可用。健壮的Agent必须有完善的错误恢复策略。

【实战案例】
在数据清洗Agent中，遇到过LLM生成包含Markdown代码块的JSON导致解析失败。通过增加“清洗中间层”，使用正则强行提取JSON内容后再传入解析器，将解析失败率从15%降至0%。

【错误恢复状态机】
```text
                    ┌───────────┐
                    │  Start    │
                    └─────┬─────┘
                          │
                          ▼
               ┌─────────────────────┐
               │   Execute Step      │─────┐
               └─────────┬───────────┘     │
                         │                 │
               ┌─────────▼─────────┐       │
               │    Error?         │       │ Success
               │ (Type Detection)  │       │
               └─────────┬─────────┘       │
           Yes │         │ No             │
      ┌─────────┴────┐    │                │
      ▼             ▼    ▼                ▼
┌──────────┐  ┌──────────┐    ┌──────────────┐
│Transient?│  │Critical? │    │    Next      │
└─────┬────┘  └────┬─────┘    │    Step      │
      │            │         └──────────────┘
      ▼            ▼
┌──────────┐  ┌──────────┐
│Retry (+  │  │Escalate  │
│Backoff)  │  │/Fallback │
└─────┬────┘  └──────────┘
      │            │
      ▼            ▼
[Limit?]──Yes─▶ [Fail/Halt]
      │ No
      ▼
[Resume]
```

【代码示例：带退避的重试装饰器】
```python
import time
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except TransientError as e:
                    if attempt == max_retries - 1:
                        raise CriticalError("Max retries exceeded")
                    delay = base_delay * (2 ** attempt) # 指数退避
                    time.sleep(delay)
            return wrapper
    return decorator
```

【错误分类与恢复策略】
1. 瞬态错误：
   - 网络超时、API限流、临时不可用
   - 策略：指数退避重试（3次，间隔1s/2s/4s）
   - 超过重试次数 → 降级到备用方案
2. 工具调用失败：
   - 参数错误：LLM重新生成参数 → 重试
   - 权限不足：跳过该步骤，记录告警
   - 工具不可用：切换到替代工具或返回部分结果
3. LLM输出异常：
   - 格式错误：JSON解析失败 → 重试 + 格式约束Prompt
   - 空回复/拒绝回答：重试或切换模型
   - 幻觉输出：后处理校验 + 重新生成
4. 逻辑错误：
   - 死循环：检测重复动作序列 → 强制跳出
   - 无进展：连续N步无状态变化 → 触发重规划
   - 上下文爆炸：Token超限 → 上下文压缩/摘要

【错误类型与策略对比】
| 错误类型 | 检测方式 | 恢复策略 | 是否重试 |
| :--- | :--- | :--- | :--- |
| 瞬态错误 | HTTP 429/503 | 指数退避重试 | 是
| 格式错误 | JSON Decode Error | 强约束Prompt重试 | 是(2次) |
| 权限错误 | HTTP 403 | 跳过/告警 | 否
| 逻辑死锁 | 状态重复计数 | 强制终止/Replan | 否 |
| 幻觉 | 事实校验不通过 | 切换模型/人工介入 | 视情况 |

【恢复框架设计】
- execute_step(): try-catch包裹每步执行
- TransientError → retry(max_attempts=3, exponential backoff)
- ValidationError → regenerate(修正参数)
- CriticalError → escalate(升级处理)
- fallback(): 所有恢复失败时的兜底策略

【状态检查点】
- 定期保存Agent执行状态（每步或每N步）
- 失败后从最近的Checkpoint恢复，而非从头开始
- 实现：Redis / PostgreSQL存储中间状态

【降级策略】
- L1 降级：大模型 → 小模型（更快但可能质量降低）
- L2 降级：Agent模式 → 简单检索+模板回答
- L3 降级：自动 → 人工转接

【可观测性】
- 错误分类统计：按类型、频率、影响范围
- Trace记录：完整执行链路，便于事后分析
- 告警：错误率突增 → 自动告警

## 常见考点
1. **幂等性设计**：如何确保重试机制不会导致重复执行（如重复下单）？
2. **状态回滚**：执行到第5步失败，前4步产生的副作用（如文件写入、数据库事务）如何回滚？
3. **Context Window管理**：在多次重试和错误恢复中，如何防止Prompt上下文无限膨胀导致OOM？

