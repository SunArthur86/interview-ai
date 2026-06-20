---
id: misc-036
difficulty: L2
category: ai-basics
subcategory: Prompt Engineering
tags:
- CAS
- Elasticsearch
feynman:
  essence: 通过明确角色、规则和约束来精确控制模型的行为边界。
  analogy: 像给新员工发详细的《岗位手册》，告诉他该做什么、不该做什么以及怎么说话。
  first_principle: 如何将模糊的任务需求转化为模型可理解、可执行的精确指令？
  key_points:
  - 使用CREATE框架构建完整人设
  - 多用具体正面指令，少用模糊否定
  - System层定规矩，User层派任务
follow_up:
- System Prompt应该多长?
- 如何版本管理Prompt?
---

# System Prompt设计的最佳实践是什么?如何设计有效的角色和约束

- **System Prompt设计框架 (CREATE):**

- **C**ontext - 角色和背景(你是XX公司的AI助手)
- **R**ole - 具体职责(你负责回答客户的技术问题)
- **E**xamples - 示例对话
- **A**uthenticity - 语气风格(专业但友好)
- **R**ules - 规则约束(不要编造、不确定时说不知道)
- **T**one - 输出格式(结构化、带标题)
- **E**dge cases - 边界处理(遇到XX时应该YY)

- **Prompt 结构化设计流程:**
```
┌─────────────────────────────────────────────────────┐
│  System Prompt (Root Instruction Set)               │
├─────────────────┬───────────────────────────────────┤
│  # IDENTITY      │  你是资深后端工程师...            │
├─────────────────┼───────────────────────────────────┤
│  # CONSTRAINTS   │  1. 仅使用 Go 语言                │
│                 │  2. 必须处理 Error                 │
├─────────────────┼───────────────────────────────────┤
│  # FORMAT        │  输出必须是 Markdown 代码块       │
├─────────────────┼───────────────────────────────────┤
│  # FEW-SHOT      │  Q: ...                           │
│  (Examples)     │  A: ... (标准答案)                 │
├─────────────────┴───────────────────────────────────┤
│  <user_input>                                   │
│  {{User Query Goes Here}}                       │
│  </user_input>                                  │
└─────────────────────────────────────────────────────┘
```

- **关键原则:**
1. **具体>模糊** - 「回答200字以内」优于「简洁回答"
2. **正面指令>负面指令** - 「只基于文档回答」优于「不要编造"
3. **结构化** - 用Markdown/XML标签组织prompt
4. **分层** - System层定角色,User层给任务
5. **可测试** - 每条规则都能通过测试用例验证

- **设计心理学技巧:**
  - **赋予思维链:** 在 Prompt 中加入 "Let's think step by step" 可以显著提升逻辑推理任务的准确性。
  - **角色绑定强化:** 开头明确 "You are an expert in [Domain]" 会让模型倾向于激活该领域的知识权重。
  - **引用标识:** 要求模型在回答时引用来源（如 "[Source ID]"），可减少幻觉并提升可追溯性。

## 常见考点
- **Token 长度限制怎么办？**：将长篇 System Prompt 压缩，或使用向量检索提取最相关的规则片段，但要注意 Core Identity（身份和核心规则）必须始终保留在上下文窗口顶部。
- **Few-shot（少样本）和 Zero-shot（零样本）如何选择？**：如果任务格式复杂或需要特定风格，Few-shot 效果更好；如果只是通用逻辑，Zero-shot 节省 Token 成本。
- **如何测试 System Prompt 的有效性？**：构建包含 Corner Cases（极端情况）和 Adversarial Inputs（对抗性输入）的测试集，进行自动化评估或人工打分。
- **模型出现「遗忘」系统指令怎么办？**：随着对话轮次增加，系统指令权重可能降低。解决方法包括：在每一轮对话中重新注入系统指令（显式拼接），或使用支持 `system` 角色的对话 API。

- **实战案例**：在设计 SQL 生成 Agent 时，最初提示词仅为「你是 SQL 专家」，模型常在遇到未知表名时瞎编。后来在 System Prompt 中显式增加规则：「遇到未在 Schema 中定义的表，直接报错，不要猜测」，这一改动让无效 SQL 的生成率降低了 90%。

- **代码示例**：
```python
# 结构化 System Prompt 构建
def build_system_prompt(config: dict):
    return f"""
# IDENTITY
You are an expert {config['role']} with 10+ years of experience.

# CONSTRAINTS
1. Always output in {config['language']}.
2. If the answer is not in the context, reply "I don't know".
3. Never output harmful content.

# FORMAT
Output result strictly in JSON format: {{"answer": "...", "source": "..."}}
""".strip()
```
