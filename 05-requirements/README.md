# 单需求工作包 / Requirements Packages

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录存放单个需求工作包（每个需求一个独立子目录）。

- **子目录命名约定**：`req-<四位编号>-<英文短名称>`（见 [00-rules/naming-and-structure.md](../00-rules/naming-and-structure.md)）。
- **状态跟踪**：需求状态统一在 [04-requirement-pool/requirement-pool.md](../04-requirement-pool/requirement-pool.md) 维护。
- **核心准则**：每个工作包应能独立定义、评审、开发和验收。

### Milestone 1 工作包索引

| 需求 ID | 需求名称 | 核心模块 | 状态 | 规格文档 | 工作包目录 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-0001` | 智能财务 Excel/CSV 拖拽入库与 Fact 映射 | 数据接入 | defined | [prd.md](req-0001-smart-file-ingestion/prd.md) | [req-0001-smart-file-ingestion/](req-0001-smart-file-ingestion/) |
| `REQ-0002` | 声明式语义指标计算引擎与多维 P&L 报表 | 计算引擎 | defined | [prd.md](req-0002-semantic-metric-engine/prd.md) | [req-0002-semantic-metric-engine/](req-0002-semantic-metric-engine/) |
| `REQ-0003` | React Flow 驱动因果沙盘画布与 What-If 模拟 | 画布推演 | defined | [prd.md](req-0003-whatif-driver-canvas/prd.md) | [req-0003-whatif-driver-canvas/](req-0003-whatif-driver-canvas/) |
| `REQ-0004` | 自主 Finance BP 方差分析 Memo 与数字穿透审计 | AI 智能 | defined | [prd.md](req-0004-ai-variance-memo/prd.md) | [req-0004-ai-variance-memo/](req-0004-ai-variance-memo/) |
| `REQ-0005` | Go 原生 Financial MCP Server 核心工具集 | 开放中枢 | defined | [prd.md](req-0005-go-mcp-server/prd.md) | [req-0005-go-mcp-server/](req-0005-go-mcp-server/) |

---

<a name="english"></a>
## English Overview

This directory houses individual requirement packages (one dedicated subdirectory per requirement).

- **Subdirectory Naming**: `req-<4-digit-number>-<short-name>` (refer to [00-rules/naming-and-structure.md](../00-rules/naming-and-structure.md)).
- **Status Tracking**: Requirement statuses are strictly maintained in [04-requirement-pool/requirement-pool.md](../04-requirement-pool/requirement-pool.md).
- **Core Principle**: Each package must be independently definable, reviewable, implementable, and verifiable.

### Milestone 1 Work Packages Index

| Requirement ID | Requirement Name | Core Module | Status | Specification | Package Directory |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-0001` | Smart Financial File Ingestion & Fact Mapping | Ingestion | defined | [prd.md](req-0001-smart-file-ingestion/prd.md) | [req-0001-smart-file-ingestion/](req-0001-smart-file-ingestion/) |
| `REQ-0002` | Declarative Semantic Metric Engine & Multi-dim P&L | Compute Engine | defined | [prd.md](req-0002-semantic-metric-engine/prd.md) | [req-0002-semantic-metric-engine/](req-0002-semantic-metric-engine/) |
| `REQ-0003` | React Flow Causal Driver Canvas & What-If | Canvas & Simulation | defined | [prd.md](req-0003-whatif-driver-canvas/prd.md) | [req-0003-whatif-driver-canvas/](req-0003-whatif-driver-canvas/) |
| `REQ-0004` | Autonomous Variance Memo & Audit Drill-down | AI Financial BP | defined | [prd.md](req-0004-ai-variance-memo/prd.md) | [req-0004-ai-variance-memo/](req-0004-ai-variance-memo/) |
| `REQ-0005` | Go Native Financial MCP Server Core Tools | MCP Hub | defined | [prd.md](req-0005-go-mcp-server/prd.md) | [req-0005-go-mcp-server/](req-0005-go-mcp-server/) |
