# REQ-0002: 声明式语义指标计算引擎与多维 P&L 报表 / Declarative Semantic Engine & Multi-dim P&L

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0002` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：计算引擎 (Go 语义解析器 + DuckDB 列式引擎 + 多维 P&L 透视)
- **前置依赖**：`REQ-0001`（底层 Fact 事实表由接入管道构建）
- **后置依赖**：`REQ-0003`（What-If 画布因果节点绑定）、`REQ-0004`（AI 审计 Memo 数据源）、`REQ-0005`（MCP Server 核心查询工具）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0002`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: Compute Engine (Go Semantic Catalog Parser + DuckDB Columnar Engine + Multi-dim P&L Pivot)
- **Dependencies**: `REQ-0001` (Underlying Fact tables populated by the ingestion pipeline)
- **Downstream**: `REQ-0003` (What-If Canvas causal node binding), `REQ-0004` (AI Audit Memo data source), `REQ-0005` (MCP Server core query tools)
