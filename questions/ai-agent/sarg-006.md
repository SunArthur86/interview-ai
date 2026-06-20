---
id: sarg-006
difficulty: L2
category: ai-agent
subcategory: RAG技术
images:
- svg_rag.svg
feynman:
  essence: 专门用于存储、索引和检索高维向量数据的数据库。
  analogy: 书籍目录不仅记录书名，还能根据内容相似度快速找书。
  first_principle: 如何在大规模高维空间中实现毫秒级的近似最近邻搜索？
  key_points:
  - 分布式与SaaS之分
  - 核心算法影响性能与精度
  - pgvector降低集成门槛
---

# 向量数据库有哪些选择？各有什么特点？

主流向量数据库对比：

1. **Milvus**：
- 开源、分布式、高性能（基于 Go/C++ 实现）。
- 存储计算分离架构，支持云原生部署。
- **索引细节**：支持 HNSW（内存）、IVF（倒排）、DiskANN（磁盘索引，降低成本）及 Scalar Indexing（标量过滤）。
- **适用性**：适合亿级向量的大规模生产环境，提供 Kubernetes Operator。

2. **Pinecone**：
- 全托管 SaaS，零运维，支持 Serverless 和 Pod 模式。
- 商业产品，按用量付费（Purge 功能通常收费）。
- **适用性**：适合快速上线、无需维护基建的团队，但在数据主权和底层控制上较弱。

3. **ChromaDB**：
- 轻量级、嵌入式（支持 Python/JS），底层常依赖 SQLite 或 DuckDB。
- **适用性**：非常适合本地开发、原型验证或边缘设备；不适合高并发或大规模生产环境。

4. **Weaviate**：
- 开源，原生支持多模态（文本、图像等），自带向量化模块。
- **模块化**：内置集成 OpenAI、Cohere 等模型，无需预处理数据。
- **特性**：支持 GraphQL 查询，基于 Garbage Collection 机制优化内存。

5. **Qdrant**：
- **Rust 实现**（高性能、内存安全），支持 Filter 过滤和 Payload 索引。
- **特性**：支持分片和复制，提供优化的 HNSW 实现，适合对性能和过滤精准度要求高的场景。

6. **pgvector（PostgreSQL 扩展）**：
- 在现有 PG 数据库上添加向量支持，实现了 IVFFlat 和 HNSW 索引。
- **适用性**：适合不想引入新组件、数据量中等（千万级以下）且需要强事务一致性的项目。
- **局限**：在高维向量搜索性能上不及专用数据库，并行查询能力较弱。

### 实战深化

**1. 实战案例**：在做 RAG 系统召回率测试时，发现 Milvus 的 HNSW 索引在大批量写入数据时内存暴涨导致 OOM。切换到 **DiskANN** 索引后，虽然查询延迟增加了 20ms，但内存占用降低了 60%，成功在有限资源的 Kubernetes 节点上稳定运行。

**2. 代码示例 (pgvector SQL)**：
```sql
-- 结合了元数据过滤的混合检索实战
SELECT id, content, 1 - (embedding <=> '[...query_vector...]') as similarity
FROM documents
WHERE category = 'tech_reports' -- 标量过滤，缩小范围
  AND created_at > '2023-01-01'
ORDER BY 
  embedding <=> '[...query_vector...]' -- 余弦距离排序
LIMIT 5;
```

**3. 向量数据库选型决策表**：

| 维度 | Milvus | Pinecone | Qdrant | pgvector |
| :--- | :--- | :--- | :--- | :--- |
| **部署模式** | 私有化/云原生 | SaaS 全托管 | 私有化/Docker | 私有化/扩展 |
| **性能上限** | 极高 (C++/分布式) | 高 (托管优化) | 高 (Rust/内存安全) | 中 (受限于 PG 进程) |
| **运维成本** | 高 (需维护集群) | 低 (免运维) | 中 (单机易，集群需配置) | 低 (复用 DBA 经验) |
| **功能丰富度** | 高 (多索引/标量) | 中 (偏基础) | 中 (强过滤/Payload) | 低 (基础向量 + SQL) |
| **最佳场景** | 千万-亿级大规模数据 | 快速 MVP/初创公司 | 高性能+复杂过滤需求 | 中小规模/已有 PG 体系 |

**索引算法原理与边界**：
- **HNSW (Hierarchical Navigable Small World)**：基于图结构，精度极高，查询速度快，但构建索引内存消耗大且写入速度较慢。适合读多写少场景。
- **IVF (Inverted File Index)**：基于聚类（如 K-Means），将向量空间划分为若干个单元，搜索时只查询最近的 N 个单元（nprobe 参数）。平衡了速度和内存，需要调参。
- **DiskANN**：微软提出的基于磁盘的图索引，通过 Vamana 图结构实现 SSD 上的高性能检索，突破内存容量限制，适合超大规模数据集（10亿+）。

## 常见考点
1. **向量数据库与传统关系型数据库的本质区别是什么？**
   - 传统数据库基于精确匹配（B+树），向量数据库基于语义相似度（近似最近邻搜索 ANN）。
2. **如何评估向量数据库的性能？**
   - 关注三个指标：Recall（召回率/精度）、QPS（查询吞吐量）、Latency（延迟）。这三者通常需要权衡（如牺牲 Recall 换取 QPS）。
3. **什么时候不需要向量数据库？**
   - 数据量极小（几万条）且无需高并发，直接使用内存计算（如 Faiss）即可；或者主要需求是精确关键词匹配而非语义搜索。
4. **标量过滤在向量检索中是如何工作的？**
   - 先进行标量过滤或后过滤。Pre-filtering 可能会导致检索空间变小从而降低召回率，Post-filtering 则可能丢弃部分结果，需根据场景选择。
