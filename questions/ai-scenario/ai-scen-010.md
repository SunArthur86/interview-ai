---
id: ai-scen-010
difficulty: L3
category: ai-scenario
subcategory: AI Agent系统设计
tags:
- Tool Calling
- Agent安全
- Prompt注入
- 权限控制
- Human-in-the-Loop
- 审计
feynman:
  essence: 构建多层防御网，在工具注册、参数校验、执行检查和人机确认四个环节严格管控。
  analogy: 像操作系统的权限控制，普通用户不能删库，高危操作必须输入管理员密码确认。
  first_principle: 如何在赋予Agent能力的同时，确保其不执行越界或危险的操作？
  key_points:
  - 工具必须白名单注册，分级管理权限。
  - 参数需通过Schema校验和注入检测。
  - 高风险操作必须经过人工确认。
  - 全链路审计日志记录，异常行为熔断。
follow_up:
- 如何在不影响用户体验的前提下实现安全审批？
- Agent被注入后调用了未授权工具，如何事后追溯？
- 如何平衡Agent的自主性和安全性？
---

# 如何设计AI Agent的工具调用（Tool Calling）安全边界？防止Agent执行危险操作。

【场景分析】
Tool Calling风险：Agent可能被Prompt注入诱导执行未授权操作、调用错误的工具、传递危险参数。安全边界设计是生产级Agent的核心。

【实战案例】
某客服Agent曾被诱导调用"内部运维接口"删除用户订单，原因是对参数中的`"command": "rm -rf"`未做语义识别。引入注入检测层后，拦截率提升至99%。

【安全分层架构】
1. **工具注册与权限**：
   - 白名单机制：Agent只能调用注册过的工具
   - 分级权限：只读工具（查询）/ 写入工具（创建修改）/ 危险工具（删除/转账）
   - 租户隔离：不同租户可用的工具集合不同
2. **参数校验层（Gateway）**：
   - JSON Schema校验：调用参数必须符合预定义Schema（类型、必填项）
   - 范围限制：金额<上限、时间范围合法、ID格式正确（Regex校验）
   - 注入检测：参数值扫描Prompt注入模式（如"Ignore previous instructions"）
3. **执行前检查（Context Check）**：
   - 身份验证：当前用户是否有权限执行该操作（RBAC/ABAC）
   - 资源归属：操作的资源是否属于当前用户（防止越权访问IDOR）
   - 风险评估：操作的风险等级（low/medium/high/critical）
4. **Human-in-the-Loop**：
   - 高风险操作：Agent生成执行计划 → 人工确认 → 执行
   - 二次确认：敏感操作（删除、转账）需要额外验证（如OTP或弹窗）
   - 审计日志：记录完整的调用链（谁、何时、什么参数、结果）

【关键代码示例：参数校验与注入检测】
```python
from pydantic import BaseModel, validator
import re

class TransferRequest(BaseModel):
    amount: float
    target_account: str
    description: str

    @validator('amount')
    def check_limit(cls, v):
        if v > 10000:  # 单笔限额
            raise ValueError('Amount exceeds safety limit')
        return v

    @validator('description')
    def check_injection(cls, v):
        # 简单的Prompt注入模式检测
        if re.search(r'ignore|previous|system', v, re.IGNORECASE):
            raise ValueError('Potential prompt injection detected')
        return v
```

【Tool Calling 安全过滤流程图】
┌──────────┐   1. Tool Call   ┌──────────────┐   2. Schema   ┌──────────────┐
│   LLM    │────────────────>│  Security    │──────────────>│  Validation  │
│  Agent   │ (name, args)    │  Gateway     │   Check       │  (Regex/Type)│
└──────────┘                  └──────┬───────┘               └──────┬───────┘
                                     │                              │
                                     │ Fail                         │ Fail
                                     ▼                              ▼
                              ┌──────────────┐               ┌──────────────┐
                              │   Reject/    │               │   Reject/    │
                              │   Rewrite    │               │   Rewrite    │
                              └──────────────┘               └──────────────┘
                                     │                              │
                                     │ Pass                         │ Pass
                                     └──────────┬───────────────────┘
                                                ▼
                                     ┌──────────────────────┐
                                     │  Context & Permission│
                                     │      Check (RBAC)     │
                                     └──────────┬───────────────┘
