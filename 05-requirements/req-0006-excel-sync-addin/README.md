# REQ-0006: Excel 双向同步插件 (Office.js) 与语义公式绑定 / Excel Two-Way Sync Add-in

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0006` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：表格集成 (Office.js Web Add-in + 自定义函数引擎 + 双向推演写回)
- **前置依赖**：`REQ-0002`（声明式语义指标计算引擎）、`REQ-0005`（Go 原生 Financial MCP Server）
- **后置依赖**：`REQ-0007`（可复用图表与数据抽取用于幻灯片生成）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0006`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: Spreadsheet Integration (Office.js Web Add-in + Custom Function Engine + Bidirectional Scenario Push-Back)
- **Dependencies**: `REQ-0002` (Semantic Metric Engine), `REQ-0005` (Financial MCP Server)
- **Downstream**: `REQ-0007` (Chart and data extraction leveraged for slide presentations)
