---
id: misc-049
difficulty: L2
category: ai-basics
subcategory: 评估与安全
feynman:
  essence: 模型在处理长上下文时，容易“遗忘”中间部分的信息。
  analogy: 像背课文，往往只记得开头和结尾，中间总是记混。
  first_principle: 如何让模型在长上下文中均匀地关注到所有信息，特别是中间部分？
  key_points:
  - 表现：注意力权重呈U型分布，首尾高、中间低。
  - 缓解：重排文档（关键置首尾）、摘要压缩、结构化提示。
  - 根因：Transformer架构位置编码和注意力机制的局限。
follow_up:
- Naive RAG vs RAG-Fusion如何处理长上下文?
- 为什么注意力会集中在开头和结尾?
---

# 为什么LLM存在「Lost in the Middle」问题?如何缓解

**LLM 「Lost in the Middle」 现象与缓解**

**Lost in the Middle** 是指大模型在处理长上下文时，倾向于更好地利用开头和结尾的信息，而忽略中间部分内容的倾向。

---

### 1. 现象描述与原理

*   **U型性能曲线**: 当关键信息被放置在 Prompt 的不同位置时，模型的表现呈现“两头高、中间低”的 U 型曲线。
*   **注意力机制局限**: Transformer 的注意力机制虽然有全局感受野，但在实际推理中，显式的注意力权重往往更容易集中在 Tokens 的序列边界附近（类似人类的首因效应和近因效应）。
*   **位置编码**: 虽然 RoPE、ALiBi 等相对位置编码支持长文本，但模型在长序列训练时的数据分布往往未充分覆盖“关键信息在极长中间”的情况。

### 2. 现象示意图

```text
Prompt Performance (Accuracy)
  High │      ░░░░                              ░░░░
       │    ░░░░░░░░                          ░░░░░░░░
  Med  │   ░░░░    ░░░░                    ░░░░    ░░░░
       │  ░░░░        ░░░░                ░░░░        ░░░░
  Low  │ ░░░░            ░░░░░░░░░░░░░░░░░░░░            ░░░░
       └──────────────────────────────────────────────────────> Position
       Start                                            Middle      End

Key: ░ = Performance Level
```

---

### 3. 缓解策略与实战

#### (1) 重排
*   **原理**: 既然模型喜欢两头，就把最重要的文档“人为”地放在开头或结尾。
*   **方法**: 使用 Cross-Encoder 或 BGE-Reranker 等重排序模型，计算 Query 与文档的相关度分数，将高分文档置于 Prompt 的首位和末位，低分文档放在中间。

#### (2) 文档压缩/摘要
*   **原理**: 减少中间位置的 Token 数量，降低噪声干扰。
*   **方法**: 使用一个小型的 LLM 先对长文档进行摘要，或者使用像 LLMLingua 这样的算法，通过计算 Token 对 Query 的贡献度，移除不重要的词（如停用词、废话），只保留关键信息。

#### (3) 结构化 Prompt
*   **原理**: 降低模型定位信息的难度，增加显式的索引信号。
*   **方法**:
    *   使用 XML 标签：`<doc_1>content...</doc_1>`
    *   使用 Markdown 列表或表头：明确指示模型参考特定 ID 的内容。
    *   引导词："Please find information in Document [ID]..."

#### (4) 注意力偏向 / 长上下文微调
*   **原理**: 从模型内部改变其注意力偏好。
*   **方法**:
    *   **训练数据构造**: 在 SFT (Supervised Fine-tuning) 阶段，构造大量“关键信息在中间”的训练样本，强制模型学会关注中间部分。
    *   **NHA (Needle In A Haystack)** 测试集微调：专门针对大海捞针任务进行强化。

| 策略 | 难度 | 效果 | 副作用 |
| :--- | :--- | :--- | :--- |
| **重排** | 低 | 高 | 增加了推理耗时和排序成本 |
| **文档压缩 (LLMLingua)** | 中 | 中 | 可能丢失细节，引入额外压缩步骤 |
| **结构化 Prompt** | 低 | 低 | 无法根本解决注意力分散，仅起辅助作用 |
| **长上下文微调** | 高 | 高 | 需要训练资源，可能导致过拟合 |

**实战案例**：在构建企业知识库问答时，直接将检索到的 20 个文档拼接喂给 LLM，导致位于第 10-12 个文档中的关键条款被忽略。解决方案是：**只取前 5 个最相关的文档**，并使用 XML 标签明确分隔，同时在 Prompt 中显式要求“请仔细阅读所有文档内容，特别注意中间部分的细节”，成功规避了中间信息丢失。

**代码示例 (结构化 Prompt 拼接)**:

```pythonndef build_rag_prompt(query, retrieved_docs):
    context_parts = []
    for idx, doc in enumerate(retrieved_docs):
        # 使用 XML 标签增强文档边界感，帮助模型定位
        context_parts.append(f"<document id="{idx}">\n{doc['content']}\n</document>")
    
    context_str = "\n\n".join(context_parts)
    
    prompt = f"""Answer the question based on the following documents.
Documents:
{context_str}

Question: {query}

Instruction: Please check ALL documents, especially the middle ones, before answering.
Answer:"""
    return prompt
```
