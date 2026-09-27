# REQ-0004: 自主 Finance BP 方差分析 Memo 与数字穿透审计 / Autonomous Variance Memo & Audit Drill-down

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

本目录包含需求 `REQ-0004` 的全部设计与实现资产。

- **完整需求规格说明**：详见 [prd.md](prd.md)
- **需求生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **核心模块**：AI 智能 (自主 Finance BP 智能体 + PVM 数学方差分解 + 模型中立网关 + 穿透审计抽屉)
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供的 PVM 方差拆解与底层事实表数据）
- **后置依赖**：无（作为核心业务消费端）

---

<a name="english"></a>
## English Overview

This directory houses all specification and implementation artifacts for `REQ-0004`.

- **Comprehensive PRD**: See [prd.md](prd.md)
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Core Module**: AI Financial BP (Autonomous FBP Agent + PVM Variance Decomposition + Protocol-Neutral Gateway + Audit Drill-down Drawer)
- **Dependencies**: `REQ-0002` (Depends on Semantic Metric Engine for PVM variance figures and fact ledger data)
- **Downstream**: None (Acts as a primary business consumption layer)
