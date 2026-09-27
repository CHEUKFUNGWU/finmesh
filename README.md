# FinMesh 产品工作空间与工程仓库 / Product & Engineering Workspace

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本仓库用于长期管理 FinMesh 的产品认知、需求、版本、验收以及工程脚手架代码。

### 当前阶段
- 已建立产品工作流和目录规则。
- 架构蓝图与产品基线已落盘于 [02-product/architecture-whitepaper.md](02-product/architecture-whitepaper.md)。
- **Milestone 1 需求包已初始化**：覆盖 [05-requirements/](05-requirements/README.md) 下的 `REQ-0001` 至 `REQ-0005`（智能入库、语义指标引擎、因果沙盘、AI 方差 Memo、Go MCP Server）。
- **工程脚手架已搭建**：
  - 后端核心中台：[finmesh-backend/](finmesh-backend/README.md)（Go 1.25+、DuckDB 列式存储、Kahn DAG 语义编译器、`mcp-go` 开放中枢，单元测试全绿通过）。
  - 前端财务工作台：[finmesh-frontend/](finmesh-frontend/README.md)（Next.js 15+ App Router、React 19、Tailwind CSS、P&L 报表、What-If 驱动沙盘与零幻觉穿透抽屉）。

### 常用入口

| 目标工作 | 入口路径 |
| :--- | :--- |
| 查看项目规则和工作流 | [AGENTS.md](AGENTS.md)、[00-rules/](00-rules/README.md) |
| 登记讨论、文档和其他输入 | [01-inputs/](01-inputs/README.md) |
| 查看产品背景、架构和术语 | [02-product/](02-product/README.md) |
| 查看问题空间、模块地图和决策 | [03-planning/](03-planning/README.md) |
| 查看或登记候选需求 | [04-requirement-pool/](04-requirement-pool/README.md) |
| 推进单个正式需求包 (M1) | [05-requirements/](05-requirements/README.md) |
| 后端工程核心中台 (Go + DuckDB) | [finmesh-backend/](finmesh-backend/README.md) |
| 前端财务工作台 (Next.js 15) | [finmesh-frontend/](finmesh-frontend/README.md) |
| 启动和跟踪版本 | [06-versions/](06-versions/README.md) |
| 保存验收和复盘 | [07-reviews/](07-reviews/README.md) |
| 查看共享资产 | [90-assets/](90-assets/README.md) |

---

<a name="english"></a>
## English Overview

This repository is maintained for managing product cognition, requirements, versions, acceptance, and engineering implementation of FinMesh over the long term.

### Current Status
- Product workflow and directory governance rules established.
- Architecture blueprint and platform baselines documented in [02-product/architecture-whitepaper.md](02-product/architecture-whitepaper.md).
- **Milestone 1 Requirements Initialized**: Covers `REQ-0001` through `REQ-0005` in [05-requirements/](05-requirements/README.md) (Smart Ingestion, Semantic Engine, Causal Canvas, AI Variance Memo, Go MCP Server).
- **Engineering Scaffolding Active**:
  - Backend Compute Core: [finmesh-backend/](finmesh-backend/README.md) (Go 1.25+, DuckDB columnar storage, Kahn DAG semantic compiler, `mcp-go` hub, 100% unit tests passing).
  - Frontend Financial Workspace: [finmesh-frontend/](finmesh-frontend/README.md) (Next.js 15+ App Router, React 19, Tailwind CSS, P&L reporting, What-If causal sandbox, and zero-hallucination audit drawer).

### Workspace Navigation

| Target Action | Entry Path |
| :--- | :--- |
| Project rules and workflows | [AGENTS.md](AGENTS.md), [00-rules/](00-rules/README.md) |
| Register discussions, docs, and inputs | [01-inputs/](01-inputs/README.md) |
| Product facts, architecture, and glossary | [02-product/](02-product/README.md) |
| Problem space, module map, and decision log | [03-planning/](03-planning/README.md) |
| Browse or register candidate requirements | [04-requirement-pool/](04-requirement-pool/README.md) |
| Milestone 1 Requirement Packages | [05-requirements/](05-requirements/README.md) |
| Backend Core Engine (Go + DuckDB) | [finmesh-backend/](finmesh-backend/README.md) |
| Frontend Financial Workspace (Next.js 15) | [finmesh-frontend/](finmesh-frontend/README.md) |
| Initiate and manage release versions | [06-versions/](06-versions/README.md) |
| Acceptance reviews and postmortems | [07-reviews/](07-reviews/README.md) |
| Shared multimedia and diagram assets | [90-assets/](90-assets/README.md) |
