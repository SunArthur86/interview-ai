---
id: ai-scen-013
difficulty: L3
category: ai-scenario
subcategory: AI Agent系统设计
tags:
- Human-in-the-Loop
- 人机协作
- 风险控制
- 审核流程
- 影子模式
- 反馈闭环
feynman:
  essence: 在关键决策节点引入人工审核，建立安全网，确保Agent行为可控且准确。
  analogy: 像自动驾驶的L2/L3级，机器负责大部分驾驶，但复杂路口或突发情况必须人接管。
  first_principle: 如何在自动化效率与人类的责任判断之间取得最佳平衡？
  key_points:
  - 高风险操作采用先审后行，低风险采用先行后审。
  - 基于风险评分、置信度和合规要求触发审核。
  - 设计高效的审核界面，支持批量处理和差异对比。
  - 通过反馈闭环优化Agent能力，逐步建立信任。
follow_up:
- 如何平衡人工审核的成本和安全性？
- Agent的置信度分数如何校准？
- 如何设计渐进式信任机制？
---

# 如何设计一个Human-in-the-Loop（人机协作）的AI Agent系统？在关键决策点引入人工审核。

【场景分析】
纯自主Agent在高风险场景不可接受（医疗、金融、法律）。Human-in-the-Loop在保持效率的同时确保安全性和准确性。

【实战案例】
在金融风控Agent中，直接执行“冻结账户”操作曾导致误冻VIP客户，引发投诉。后增加“高危动作双因素确认”机制，超过10万元的操作必须由安全员在独立的审核系统中输入Token放行。

【人机协作架构】
```text
┌──────────────────┐
│   User Input     │
└────────┬─────────┘
         ▼
┌──────────────────┐     ┌──────────────────┐
│   Agent Core     │────▶│ Risk Engine      │
│ (Plan/Exec)      │     │ (Score/Check)    │
└────────┬─────────┘     └────────┬─────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │ Score > Threshold?│
         │              └────────┬─────────┘
         │           Yes /      \ No
         │            /          \
         ▼           ▼            ▼
┌──────────────────┐  ┌──────────┐  ┌──────────────┐
│   Review UI      │  │ Execute  │  │ Direct Exec  │
│ (Human Approval) │  │ (Wait)   │  │ (Auto)       │
└────────┬─────────┘  └──────────┘  └──────────────┘
         │
         ▼
┌──────────────────┐
│ Feedback Loop    │◀────[Action Taken]
│ (Fine-tune)      │
└──────────────────┘
```

【代码示例：风险拦截与异步等待】
```python
def execute_with_guardrails(action):
    risk_score = risk_engine.calculate(action)
    if risk_score > THRESHOLD:
        # 发送审核事件并挂起任务
        review_id = audit_service.create_request(action)
        # 状态机进入 WAITING_APPROVAL 状态
        return State(status="WAITING", review_id=review_id)
    
    # 低风险直接执行
    return tool_executor.run(action)

# 人工审核回调处理
def handle_approval(review_id, approved):
    if approved:
        task = db.get_task_by_review(review_id)
        tool_executor.run(task.pending_action)
```

【人机协作模式】
1. Review-then-Act（先审后行）：
   - Agent生成执行计划 → 人工审核确认 → 自动执行
   - 适用：高风险操作（资金转账、合同发送、数据删除）
   - 延迟代价：增加人工审核时间（分钟~小时级）
2. Act-then-Review（先行后审）：
   - Agent自动执行 → 异常时人工复核
   - 适用：低风险但有审计需求的场景
3. Shadow Mode（影子模式）：
   - Agent生成建议但不执行，人工并行处理
   - 对比Agent建议和人工结果，持续校准
   - 适用：Agent上线前的验证阶段
4. Interactive Correction（交互修正）：
   - Agent输出初稿 → 用户修改 → Agent学习用户偏好
   - 适用：内容创作、代码生成

【协作模式对比】
| 模式 | 安全性 | 实时性 | 成本(人力) | 关键应用 |
| :--- | :--- | :--- | :--- | :--- |
| Review-then-Act | 极高 | 低（阻塞性） | 高 | 线上变更、资金交易 |
| Act-then-Review | 中 | 高 | 中 | 内容审核、日志分析 |
| Shadow Mode | 极高（无损） | 低（并行） | 高 | 灰度发布、模型评估 |
| Interactive | 中 | 中（交互式） | 低 | 辅助编程、文案写作 |

【触发审核的条件】
- 风险评分：操作风险等级 >= HIGH → 强制人工审核
- 置信度：Agent输出置信度 < 阈值 → 请求人工确认
- 异常检测：偏离历史模式的操作 → 触发审核
- 合规要求：特定操作类型法定需要人工审批
- 金额阈值：金融操作超过一定金额

【审核界面设计】
- 上下文展示：完整展示Agent的推理过程和决策依据
- 差异对比：高亮Agent建议和标准答案的差异
- 批量审核：低风险项批量批准，高风险项逐条审核
- 快捷操作：一键批准/拒绝/修改

【效率优化】
- 渐进式信任：新用户所有操作都审核 → 逐渐降低审核频率
- 分级审核：Junior审低风险 → Senior审高风险
- 智能路由：根据风险类型路由给对应专家

【反馈闭环】
- 人工修改 → 记录差异 → 用于微调Agent
- 审核通过率 → 作为Agent质量指标
- 审核耗时 → 优化审核流程

## 常见考点
1. **一致性控制**：多人在并行审核时，如何解决状态冲突和版本控制问题？
2. **冷启动问题**：在没有任何历史数据时，如何设定初始的风险阈值？
3. **延迟权衡**：如何设计机制平衡审核带来的安全性增加与响应时间延迟？
4. **样本构建**：如何将人工的审核记录转化为高质量的 RLHF（人类反馈强化学习）数据？

