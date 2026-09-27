# REQ-0001: 智能财务文件拖拽入库与 Fact 映射 / Smart Financial File Ingestion

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0001` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：数据接入管道 (Go `excelize` + DuckDB `Appender`)
- **前置依赖**：无
- **后置依赖**：`REQ-0002`（语义指标引擎需基于本需求生成的 Fact 表运行）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0001`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: Data Ingestion Pipeline (Go `excelize` + DuckDB `Appender`)
- **Dependencies**: None
- **Downstream**: `REQ-0002` (Semantic Metric Engine depends on Fact tables created by this requirement)
