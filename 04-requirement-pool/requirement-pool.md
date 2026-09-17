# 需求池 / Requirement Pool

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
<a name="english"></a>
| 需求 ID / ID | 需求名称 / Requirement Name | 来源 / Source | 所属模块 / Module | 状态 / Status | 优先级 / Priority | 负责人 / Owner | 目标版本 / Target | 前置依赖 / Depends On | 工作包 / Work Package |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-0001` | 智能财务文件入库与 Actual/Budget 双情景 Fact 映射 / Smart File Ingestion & Actual/Budget Fact Mapping | `SRC-0001` | 数据接入 / Ingestion | analyzing | P0 | PM / Eng | v0.1 | 无 / None | 待 Wave 2：`05-requirements/req-0001-actual-budget-ingestion/` |
| `REQ-0002` | 语义指标与预实差 P&L 网格 / Semantic Metrics & Actual-vs-Budget P&L Grid | `SRC-0001` | 计算引擎 / Engine | analyzing | P0 | Eng | v0.1 | `REQ-0001` | 待 Wave 2：`05-requirements/req-0002-variance-pnl-grid/` |
| `REQ-0003` | 预置驱动因子沙盘 / Preset Driver Canvas | `SRC-0001` | 画布推演 / Canvas | analyzing | P0 | Frontend | v0.1 | `REQ-0002` | 待 Wave 2：`05-requirements/req-0003-preset-driver-canvas/` |
| `REQ-0004` | 预实差 Memo 与数字穿透 / Variance Memo & Audit Drill-down | `SRC-0001` | AI 智能 / AI BP | analyzing | P0 | AI / Fullstack | v0.1 | `REQ-0002` | 待 Wave 2：`05-requirements/req-0004-variance-memo-drilldown/` |
| `REQ-0005` | Go 原生 Financial MCP 核心工具 / Go Native Financial MCP Core Tools | `SRC-0001` | 开放中枢 / MCP Hub | analyzing | P0 | Backend | v0.1 | `REQ-0002` | 待 Wave 2：`05-requirements/req-0005-go-mcp-server/` |

状态从 `defined` 退回 `analyzing`：`05-requirements/` 下尚无完整规范与验收标准，不满足 `00-rules/status-and-gates.md` 对 `defined` 的门槛。目标版本为排期意向，不是 `06-versions/v0.1/scope.md` 承诺。

---

## 优先级依据 (中文)

五条均为 P0，因为 `DEC-0011` / `SRC-0001` 轮次 12 要求同一条垂直切片一次交付。任一表面可演示但月结闭环未跑通，Milestone 1 不算通过。不新增第六条 P0。联合作业闭环见 [问题空间](../03-planning/problem-space.md#milestone-1-作业闭环)，v0.1 子集见 [白皮书 §9](../02-product/architecture-whitepaper.md#9-mvp-交付范围与开发路线图)。

## Priority Rationale (English)

All five items are P0 because `DEC-0011` / `SRC-0001` Round 12 requires one vertical slice. A clickable surface without the month-end loop does not pass Milestone 1. No sixth P0 module. Shared loop: [problem space](../03-planning/problem-space.md#milestone-1-job-loop). v0.1 subset: [whitepaper §9](../02-product/architecture-whitepaper.md#9-mvp-scope--delivery-roadmap).

---

## v0.1 边界与非目标 (中文)

| 需求 ID | v0.1 边界 | 明确非目标 |
| :--- | :--- | :--- |
| `REQ-0001` | 同一映射下至少两份文件（Actual + Budget）写入 `dim_scenario`；科目映射需人工确认 | API 连接器、数仓挂载、任意宽表自由建模 |
| `REQ-0002` | Actual / Budget / Variance / Variance %；科目与部门切片；当前视图单向导出 xlsx | 完整编制、Forecast 第三版工作流、双向写回 |
| `REQ-0003` | 预置 5–8 个驱动因子；重算 P&L 与 Runway；Base vs 当前 What-If；节点编译为 SQL | 自由建模、NL 建图、Bull/Bear 编辑器 |
| `REQ-0004` | 科目树 + 部门贡献；数出语义层；点击到 SQL 与流水 | 无量价字段时的完整 PVM、独立 Chat、原生 PPT |
| `REQ-0005` | 与 `REQ-0002` 同一指标契约；四工具均支持 `scenario` | 第二套计算、与 Web 数字不一致 |

## v0.1 Boundaries & Non-Goals (English)

| ID | v0.1 boundary | Explicit non-goals |
| :--- | :--- | :--- |
| `REQ-0001` | At least two files (Actual + Budget) under one mapping into `dim_scenario`; human-confirmed COA map | API connectors, warehouse mounting, free-form wide-table modeling |
| `REQ-0002` | Actual / Budget / Variance / Variance %; account and department slices; one-way xlsx of current view | Full budget authoring, Forecast-as-a-third-process, bidirectional write-back |
| `REQ-0003` | 5–8 preset drivers; recompute P&L and runway; Base vs current What-If; nodes compile to SQL | Free-form modeling, NL graph generation, Bull/Bear editor |
| `REQ-0004` | Account tree + department contribution; figures from the semantic layer; click-through to SQL and rows | Full PVM without qty/price fields, standalone chat, native PPT |
| `REQ-0005` | Same metric contract as `REQ-0002`; all four tools accept `scenario` | A second calculator, figures that diverge from the web UI |

---

## 字段规则 (中文)
- **来源**：填写 `SRC-XXXX`，回溯原始输入。
- **状态**：使用 `00-rules/status-and-gates.md` 中的标准定义。
- **优先级**：使用 `P0/P1/P2/P3`，必须附带评估依据。
- **目标版本**：表示当前排期计划；交付承诺以 `06-versions/<version>/scope.md` 为准。

## Field Rules (English)
- **Source**: Record `SRC-XXXX` to trace back to raw inputs.
- **Status**: Follow lifecycle state definitions in `00-rules/status-and-gates.md`.
- **Priority**: Specify `P0/P1/P2/P3` with explicit evaluation rationale.
- **Target Version**: Indicates planned release; commitment is governed by `06-versions/<version>/scope.md`.
