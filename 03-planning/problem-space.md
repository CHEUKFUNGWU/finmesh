# 业财协同与沙盘推演问题空间 / Problem Space

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文定义

### 核心问题域划分

1. **数据集成与科目对齐 (Data Ingestion & COA Mapping)**：
   - 如何将不同 ERP/流水软件非标准的科目表（COA）低成本映射到标准 Fact 表。
2. **确定性指标计算与版本管理 (Semantic Metric & Multi-scenario Engine)**：
   - Actuals、Budget、Forecast 多版本的并发比对与快速聚合。
3. **因果驱动与实时推演 (Driver-based Simulation & Canvas)**：
   - 将经营因果逻辑以可视化图形呈现，并在用户调整驱动因子时毫秒级推导影响。
4. **自主归因与可解释报告 (Autonomous Attribution & Auditability)**：
   - 自动拆解方差，生成文字分析并支撑穿透到交易行。
5. **开放金融智能 (Financial MCP Extensibility)**：
   - 使外部大模型能够作为合规、可审计的财务分析师调取平台能力。

### Milestone 1 作业闭环

平台问题域（上表）描述长期能力；Milestone 1 只验收一条可独立完成的月结作业。切片形状见 `DEC-0011`，v0.1 子集见 [白皮书 §9](../02-product/architecture-whitepaper.md#9-mvp-交付范围与开发路线图)。

种子用户必须能在同一租户内完成：

1. 上传 Actual 与 Budget（同一套 COA 映射）。
2. 查看 P&L 预实差（Actual / Budget / Variance / Variance %），按科目或部门切片。
3. 点击差异数字，看到生成该数字的 SQL 与明细流水。
4. 调整 1 个预置驱动因子（含期初现金或招聘延迟），重算 P&L 与现金跑道。
5. 生成可穿透 Memo；Memo 数字与网格一致。
6. 将当前 P&L 视图单向导出为 xlsx。
7. 用同一套指标契约调用 MCP（含 `scenario`）。

五个界面分别可演示，但上述闭环未跑通，不算 Milestone 1 通过。

### 待确认

| 事项 | 冲突来源 | 当前处理 | 等级 |
| :--- | :--- | :--- | :--- |
| 数仓挂载（Warehouse-Native / BYOD）是否仍为产品承诺 | `SRC-0001` 轮次 4 选 `1+2`；轮次 8 选租户 DuckDB 文件、否决 BYOD 双轨 | v0.1 不做数仓挂载；是否进入阶段二待确认 | `待确认` |
| Text-to-SQL 是否要有独立 UI | 轮次 5 将 Text-to-SQL 列为旗舰；轮次 12 切片正文未列对话查询面 | v0.1 不交付独立 Chat 窗口；只读查询是否挂在语义层之上待确认 | `待确认` |
| 现金跑道的期初现金来源 | 轮次 10 要求滑块重算 P&L 与 Runway；阶段一入库以 GL/收入为主 | v0.1 允许沙盘节点录入期初现金，或从 GL 现金科目推导；二者以哪条为验收标准待确认 | `待确认` |

未覆盖：真实账套、预算模板样本、关账日历、种子用户原声。

---

<a name="english"></a>
## English Definition

### Core Problem Domains

1. **Data Ingestion & COA Mapping**:
   - Ingesting non-standard Charts of Accounts (COA) from diverse ERP/billing tools into standard Fact schemas with minimal configuration overhead.
2. **Deterministic Metric Calculation & Multi-Scenario Engine**:
   - Concurrent comparison and sub-second aggregation across Actuals, Budget, and Forecast versions.
3. **Driver-Based Simulation & Live Canvas**:
   - Representing business causal logic in intuitive graphs and propagating driver adjustments across the P&L in sub-100ms.
4. **Autonomous Attribution & Auditability**:
   - Automatically decomposing variances into price/volume/mix drivers, generating narrative diagnosis, and supporting line-item transaction drill-downs.
5. **Open Financial Intelligence (Financial MCP Extensibility)**:
   - Exposing audited financial capabilities to external AI agents via standard MCP endpoints.

### Milestone 1 Job Loop

The domains above describe long-term platform problems. Milestone 1 accepts one completable month-end job. Slice shape is `DEC-0011`; the v0.1 subset is [whitepaper §9](../02-product/architecture-whitepaper.md#9-mvp-scope--delivery-roadmap).

A seed user must complete, in one tenant:

1. Upload Actuals and Budget under one COA mapping.
2. View P&L Actual / Budget / Variance / Variance %, sliced by account or department.
3. Click a variance figure and see the SQL plus source ledger rows.
4. Adjust one preset driver (including opening cash or hiring delay) and recompute P&L and cash runway.
5. Generate a drill-down memo whose figures match the grid.
6. Export the current P&L view one-way to xlsx.
7. Invoke MCP with the same metric contract (including `scenario`).

Five separately clickable surfaces do not pass Milestone 1 if this loop is incomplete.

### To Confirm

| Item | Source conflict | Current handling | Confidence |
| :--- | :--- | :--- | :--- |
| Whether warehouse-native / BYOD remains a product commitment | `SRC-0001` Round 4 selected `1+2`; Round 8 selected tenant DuckDB files and rejected BYOD dual-track | Out of v0.1; Phase 2 inclusion is open | `To-Confirm` |
| Whether Text-to-SQL needs a standalone UI | Round 5 listed it as flagship; Round 12 slice text did not list a chat surface | No standalone chat window in v0.1; read-only query on the semantic layer is open | `To-Confirm` |
| Opening-cash source for runway | Round 10 requires slider recomputation of P&L and runway; Phase 1 ingestion is GL/revenue-led | v0.1 may take opening cash from a canvas node or GL cash accounts; acceptance rule is open | `To-Confirm` |

Uncovered: live ledgers, budget template samples, close calendars, and seed-user voice.

