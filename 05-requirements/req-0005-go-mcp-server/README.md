# REQ-0005: Go 原生 Financial MCP Server 核心工具集 / Go Native Financial MCP Server Core Tools

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0005` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：开放中枢 (Go 原生 `mcp-go` 服务 + `stdio` & `sse` 双传输 + 5 大财务核心工具)
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供指标目录与计算接口）
- **后置依赖**：无（作为开放生态连接器）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0005`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: MCP Hub & Integrations (Go native `mcp-go` server + `stdio` & `sse` transports + 5 core financial tools)
- **Dependencies**: `REQ-0002` (Depends on Semantic Metric Engine for metric catalog and query interfaces)
- **Downstream**: None (Serves as open ecosystem connector)
