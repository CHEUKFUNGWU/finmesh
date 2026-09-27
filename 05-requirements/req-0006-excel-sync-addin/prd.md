# REQ-0006: Excel 双向同步插件 (Office.js) 与语义公式绑定 / Excel Two-Way Sync Add-in PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0006`
- **需求名称**：Excel 双向同步插件 (Office.js) 与语义公式绑定
- **关联来源**：`SRC-0021`（Office.js 插件与选型规范）、`SRC-0001`（FP&A 工作流痛点）、`SRC-0018`（中型企业 FP&A 表格沼泽）
- **所属模块**：表格集成 (Spreadsheet Integration)
- **目标版本**：`v0.2`
- **生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **责任人**：PM / Fullstack Engineer
- **前置依赖**：`REQ-0002`（声明式语义指标计算引擎）、`REQ-0005`（Go 原生 Financial MCP Server）

---

### 2. 业务背景与用户痛点

1. `[已观察]` **表格建模刚需**：财务分析师与 FP&A 80% 以上的个性化分析、跨表勾稽与临时测算均在 Microsoft Excel 中完成；纯 Web 界面无法替代 Excel 的极速键盘快捷键与自由度（来源：`SRC-0001`、`SRC-0021`）。
2. `[已观察]` **数据孤岛与公式损坏**：传统模式下分析师从不同系统导出 CSV 复制粘贴到 Excel，公式极易因行列增删而损坏，且各部门本地文件版本割裂（来源：`SRC-0018`）。
3. `[推断]` **活体公式连接**：若在 Excel 中提供类似原生函数的 `=FINMESH.METRIC(...)`，底层直接连通 DuckDB 确定性指标层，既能保留 Excel 自由操作习惯，又能保证数据口径的唯一事实源。
4. `[待确认]` **本地网络与环境差异**：企业客户内网环境对 Office.js 侧边栏（Taskpane）加载 HTTPS 外部域名的安全策略限制需在首批试点中确认。
5. `[未覆盖]` **旧版 Excel 2013/2016 COM 插件**：本需求基于现代微软 Office.js 标准，仅支持 Excel 365、Excel 2019/2021 及 Excel 网页版；旧版 VSTO/COM 插件不纳入范围。

---

### 3. 用户故事 (User Stories)

- **US-01 (FP&A 分析师)**：作为分析师，我希望在 Excel 单元格中输入 `=FINMESH.METRIC("arr", "2026-08", "Actual")`，系统能毫秒级返回真实经审计数值，并在底层数据刷新时自动联动更新。
- **US-02 (业务财务 BP)**：作为业务 BP，我希望在 Excel 中调整下半年招聘预算与销售配额，点击侧边栏“推送到 FinMesh 画布”，即可在云端因果沙盘自动生成新的 `WhatIf_Excel` 场景并重算 P&L。
- **US-03 (财务总监/审计师)**：作为财务总监，我在审阅分析师提交的 Excel 模型时，点击任意指标单元格，能在侧边栏穿透查看该数字对应的 DuckDB 确定性 SQL 与凭证行数，杜绝人为篡改。

---

### 4. 功能性需求与技术实现标准

#### 4.1 自定义函数定义 (Custom Functions)
在 Excel JavaScript API 中注册命名空间 `FINMESH`：

```text
=FINMESH.METRIC(metric_name, period, [scenario], [department])
```

- **参数说明**：
  - `metric_name` (必填, String)：语义目录中的合法指标名称（如 `"arr"`, `"gross_margin_pct"`, `"net_burn"`）。若不存在则返回 `#FINMESH.INVALID_METRIC!`。
  - `period` (必填, String)：格式 `YYYY-MM` 或 `YYYY-Q[1-4]` 或 `YYYY`。
  - `scenario` (可选, String)：场景名称，默认 `"Actual"`，支持 `"Budget_v1"`, `"WhatIf_Bull"` 等。
  - `department` (可选, String)：部门切片过滤条件（如 `"Sales"`, `"R&D"`）。
- **批量合并请求 (Request Batching & Debouncing)**：
  - 前端插件内部建立 50ms 聚合窗口，将同一工作表内数十个乃至上百个 `FINMESH.METRIC` 函数调用合并为一次 HTTP POST 到后端 `/api/v1/metrics/batch`，防止并发风暴。

#### 4.2 侧边栏工作台 (Taskpane UI)
基于 React + Tailwind 构建嵌入式 Taskpane：
1. **指标目录选择器**：树状展示所有可用指标，支持双击一键向当前选中单元格插入公式。
2. **场景推演写回面板**：
   - 用户选中 Excel 中的一组驱动变量调整值（如 `cpm_growth: 0.12`, `discount_rate: 0.05`）；
   - 点击“同步到沙盘 (Sync to Sandbox)”，插件调用 FinMesh API 创建/更新场景，并生成对比差异。
3. **数字穿透抽屉 (Drill-down Inspector)**：
   - 选中带有 FinMesh 公式的单元格，侧边栏展示当前指标的底层事实表、SQL 递归 CTE 展开语句及最近 10 条原始流水。

---

### 5. 验收标准 (Acceptance Criteria)

- [ ] **AC-01 (公式解析正确性)**：在 Excel 中键入 `=FINMESH.METRIC("arr", "2026-08")`，返回数值与 FinMesh 网页端 `/api/v1/metrics/query` 结果严格一致（浮点误差 $\le 0.0001$）。
- [ ] **AC-02 (批量防抖性能)**：包含 100 个 FinMesh 公式的工作表在打开时，网络请求合并为 $\le 2$ 次 Batch API 调用，全表渲染时间 $\le 500\text{ms}$（本地网络缓存命中时 $\le 100\text{ms}$）。
- [ ] **AC-03 (异常容错机制)**：输入非法指标名或网络断开时，单元格展示标准 Excel 错误提示，且 Taskpane 给出具名错误诊断，不导致 Excel 卡死。
- [ ] **AC-04 (双向沙盘同步)**：从 Excel Taskpane 推送修改参数后，FinMesh Web 端 What-If 沙盘中即时出现对应 `WhatIf_Excel` 场景并更新瀑布图。
- [ ] **AC-05 (平台兼容性)**：支持 Excel 365 Desktop (Windows & macOS) 及 Excel 网页版（Edge / Chrome）。

---

<a name="english"></a>
## English Specification

### 1. Requirement Metadata
- **Requirement ID**: `REQ-0006`
- **Name**: Excel Two-Way Sync Add-in (Office.js) & Semantic Formula Binding
- **Sources**: `SRC-0021` (Office.js & Tech Selection), `SRC-0001` (FP&A Pain Points), `SRC-0018` (Mid-Market Spreadsheet Hell)
- **Module**: Spreadsheet Integration
- **Target Version**: `v0.2`
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Owners**: PM / Fullstack Engineer
- **Dependencies**: `REQ-0002` (Semantic Metric Engine), `REQ-0005` (Go Native Financial MCP Server)

---

### 2. Business Context & Pain Points

1. `[Observed]` **Spreadsheet Dominance**: Over 80% of ad-hoc financial modeling, departmental reconciliation, and sensitivity analysis take place in Microsoft Excel. Web-only tools cannot replace Excel's fluid keyboard shortcuts and cell flexibility (Sources: `SRC-0001`, `SRC-0021`).
2. `[Observed]` **Spreadsheet Rot**: Manual copy-pasting from ERPs and billing tools breaks formulas upon row/column insertion and leads to unsynchronized departmental versions (Source: `SRC-0018`).
3. `[Inferred]` **Live Semantic Formulas**: Embedding native `=FINMESH.METRIC(...)` functions linked to the DuckDB semantic engine preserves Excel modeling flexibility while guaranteeing single-source-of-truth governance.
4. `[To-Confirm]` **Enterprise Network Policies**: Network security constraints regarding Office.js Taskpane HTTPS communication within corporate VPCs need validation during initial pilot runs.
5. `[Uncovered]` **Legacy Excel COM Add-ins**: This specification targets the modern Microsoft Office.js Web Add-in standard (Excel 365, 2019/2021, and Web); legacy VSTO/COM plugins are out of scope.

---

### 3. User Stories

- **US-01 (FP&A Analyst)**: As an FP&A analyst, I want to type `=FINMESH.METRIC("arr", "2026-08", "Actual")` into any Excel cell and receive audited values in sub-200ms, updating automatically when underlying ledger data changes.
- **US-02 (Finance BP)**: As a Finance BP, I want to modify sales quotas and headcount assumptions in an Excel grid and click "Sync to FinMesh Canvas" in the Taskpane to spin up a new `WhatIf_Excel` scenario and recompute P&L impacts.
- **US-03 (CFO / Auditor)**: As a CFO, when reviewing analyst spreadsheets, I want to click any metric cell to inspect its underlying DuckDB SQL CTE execution and backing journal voucher lines in the sidebar.

---

### 4. Functional Specifications

#### 4.1 Custom Function Engine
Registered under the `FINMESH` namespace in Excel JavaScript API:

```text
=FINMESH.METRIC(metric_name, period, [scenario], [department])
```

- **Arguments**:
  - `metric_name` (Required, String): Valid metric key registered in the semantic catalog. Returns `#FINMESH.INVALID_METRIC!` if nonexistent.
  - `period` (Required, String): `YYYY-MM`, `YYYY-Q[1-4]`, or `YYYY`.
  - `scenario` (Optional, String): Target scenario, defaults to `"Actual"`.
  - `department` (Optional, String): Departmental slice filter.
- **Request Batching & Debouncing**:
  - An internal 50ms debouncing window aggregates cell evaluations across the worksheet into a single HTTP POST request to `/api/v1/metrics/batch`.

#### 4.2 Taskpane Workspace
React-based embedded sidebar:
1. **Catalog Explorer**: Tree view of verified metrics with one-click formula insertion into active cells.
2. **Scenario Push-back Panel**: Highlight modified driver assumptions in Excel and commit them directly to FinMesh What-If sandboxes.
3. **Drill-down Inspector**: Displays the exact DuckDB recursive CTE query, execution latency, and top 10 backing journal transactions for the selected formula cell.

---

### 5. Acceptance Criteria

- [ ] **AC-01 (Formula Accuracy)**: `=FINMESH.METRIC("arr", "2026-08")` returns identical results to the web workspace `/api/v1/metrics/query` ($\Delta \le 0.0001$).
- [ ] **AC-02 (Batching Performance)**: Sheets with 100 formulas trigger $\le 2$ batch requests, completing full sheet evaluation in $\le 500\text{ms}$ ($\le 100\text{ms}$ on cache hits).
- [ ] **AC-03 (Fault Tolerance)**: Invalid metric keys or network interruptions display standard descriptive errors without freezing the Excel application host.
- [ ] **AC-04 (Bidirectional Sync)**: Parameters pushed from the Taskpane instantly reflect as a new `WhatIf_Excel` scenario on the Web Causal Driver Canvas.
- [ ] **AC-05 (Cross-Platform)**: Fully functional on Excel 365 (macOS and Windows) and Excel for Web (Edge / Chrome).
