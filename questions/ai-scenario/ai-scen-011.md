---
id: ai-scen-011
difficulty: L3
category: ai-scenario
subcategory: AI Agent系统设计
tags:
- Agent记忆
- 长期记忆
- 短期记忆
- MemGPT
- 记忆管理
- 用户画像
feynman:
  essence: 建立分层存储机制，像人脑一样处理短期记忆、工作状态和长期知识的存取。
  analogy: 短期记忆像电脑内存（断电丢），长期记忆像硬盘（永久存），检索时只调取相关文件。
  first_principle: 如何让AI在有限的上下文窗口内，高效利用历史信息以提供连贯且个性化的服务？
  key_points:
  - 短期记忆用滑动窗口管理，超限自动压缩。
  - 长期记忆向量化存储，按相关性检索。
  - 记忆写入需判断重要性，支持更新与遗忘。
  - 平衡上下文长度与信息完整性。
follow_up:
- 如何判断哪些对话内容值得存入长期记忆？
- 用户隐私法规（GDPR）下，记忆系统如何设计？
- 记忆冲突时（旧记忆vs新信息）如何处理？
---

# 如何设计AI Agent的记忆系统？支持短期对话记忆和长期知识积累。

【场景分析】
Agent记忆三大需求：短期记忆（当前对话上下文）、工作记忆（任务执行中的中间状态）、长期记忆（跨会话的用户偏好和知识）。

【实战案例】
在构建私人助理时，直接将历史对话全量存入Redis导致Context Window超限且成本激增。改用"重要事件摘要+向量检索"策略后，Token消耗降低60%，且能准确回忆起"用户上周提到的过敏原"。

【三层记忆架构】
1. **短期记忆（Working Memory）**：
   - 存储：当前对话的消息历史（system + user + assistant）
   - 管理：滑动窗口（保留最近N轮）+ Token预算控制
   - 上下文压缩：超出窗口时用LLM总结早期对话（摘要替代原文）
   - 实现：内存中的消息列表 / Redis（持久化Session）
2. **工作记忆（Episodic Memory）**：
   - 存储：当前任务的执行轨迹（工具调用、中间结果、思考过程）
   - 用途：Agent可以回看之前的步骤，避免重复操作，支持多步骤推理
   - 清理：任务完成后归档或删除
   - 实现：任务级别的链式结构存储，如Linked List或Graph
3. **长期记忆（Long-Term Memory）**：
   - 类型A - 用户画像：偏好、习惯、历史交互摘要
   - 类型B - 知识记忆：Agent学到的有用信息（如「用户喜欢简洁回答」）
   - 类型C - 事件记忆：重要交互记录（如「上周帮用户做了XX」）
   - 存储：向量化存入向量库 + 结构化存入数据库（KV存储）
   - 检索：当前对话上下文 → Embedding → 向量库检索Top-K → 注入Prompt

【关键代码示例：混合记忆检索】
```python
from langchain.vectorstores import FAISS
from langchain.schema import Document

def retrieve_context(query: str, user_id: str):
    # 1. 获取短期记忆
    stm = redis_client.get(f"session:{user_id}:recent")
    
    # 2. 检索长期记忆（向量库）
    vector_db = FAISS.load_local(f"index/{user_id}")
    relevant_docs = vector_db.similarity_search(query, k=3)
    
    # 3. 组装上下文
    context = f"Recent Chat: {stm}\n"
    context += "Relevant Memories:\n" + "\n".join([d.page_content for d in relevant_docs])
    return context
```

【记忆读写与检索架构图】
┌─────────────┐
│ Current Input│
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│   Memory Controller  │<──────────────────┐
│ (Read/Write/Reflect) │                   │
└──────┬───────────────┘                   │
       │                                   │
       │ 1. Search Query                   │
       ▼                                   │
┌──────────────────────┐                   │
│   Vector Store (LTM) │                   │
│ (Facts/Events)       │                   │
└──────────────────────┘                   │
       ▼                                   │
┌──────────────────────┐                   │
│   Structured Store   │                   │
│ (User Profile/KV)    │                   │
└──────────────────────┘                   │
       │                                   │
       │ 2. Retrieve Relevant Memories     │
       ▼                                   │
┌──────────────────────┐                   │
│ Context Builder      │                   │
│ (STM + Retrieved LTM)│                   │
└──────────────────────┘                   │
       │                                   │
       │ 3. Write (If Important)           │
       └───────────────────────────────────┘

【记忆管理策略】
- **写入**：不是所有对话都值得记忆 → LLM判断重要性（1-5分），阈值以上才写入
- **更新**：用新信息更新旧记忆（如「用户之前住北京」→「现在搬到了上海」，需处理时间演化和冲突）
- **遗忘**：低频访问 + 过期记忆 → 软删除或归档到冷存储
- **隐私**：敏感信息脱敏存储（PII过滤）

【存储选型对比表】

| 维度 | 短期记忆 (STM) | 工作记忆 (WM) | 长期记忆 (LTM) |
| :--- | :--- | :--- | :--- |
| **核心用途** | 维持对话连贯性 | 任务推理与状态跟踪 | 用户画像与知识沉淀 |
| **数据结构** | 线性消息列表 | 链表/图/树结构 | 键值对 + 向量索引 |
| **存储介质** | 内存 / Redis | 内存 / Redis / PostgreSQL | Vector DB (Pinecone/Milvus) + SQL |
| **读写特性** | 高频追加，过期清理 | 临时写入，任务结束归档 | 低频写入，高频语义检索 |
| **成本考量** | 极低（滑动窗口） | 低（随会话释放） | 高（需长期持久化与计算） |
