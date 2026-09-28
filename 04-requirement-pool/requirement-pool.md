# 需求池 / Requirement Pool

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
<a name="english"></a>
| 需求 ID / ID | 需求名称 / Requirement Name | 来源 / Source | 所属模块 / Module | 状态 / Status | 优先级 / Priority | 负责人 / Owner | 目标版本 / Target | 前置依赖 / Depends On | 工作包 / Work Package |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-0001` | 智能财务 Excel/CSV 拖拽入库与 Fact 映射 / Smart Excel/CSV Ingestion & Fact Mapping | `SRC-0001` | 数据接入 / Ingestion | defined | P0 | PM / Eng | v0.1 | 无 / None | [05-requirements/req-0001-smart-file-ingestion/](../05-requirements/req-0001-smart-file-ingestion/) |
| `REQ-0002` | 声明式语义指标计算引擎与多维 P&L 报表 / Declarative Semantic Engine & Multi-dim P&L | `SRC-0001` | 计算引擎 / Engine | defined | P0 | Eng | v0.1 | `REQ-0001` | [05-requirements/req-0002-semantic-metric-engine/](../05-requirements/req-0002-semantic-metric-engine/) |
| `REQ-0003` | React Flow 驱动因果沙盘画布与 What-If 模拟 / React Flow Causal Driver Canvas & What-If | `SRC-0001` | 画布推演 / Canvas | defined | P0 | Frontend | v0.1 | `REQ-0002` | [05-requirements/req-0003-whatif-driver-canvas/](../05-requirements/req-0003-whatif-driver-canvas/) |
| `REQ-0004` | 自主 Finance BP 方差分析 Memo 与数字穿透审计 / Autonomous Variance Memo & Audit Drill-down | `SRC-0001` | AI 智能 / AI BP | defined | P0 | AI / Fullstack | v0.1 | `REQ-0002` | [05-requirements/req-0004-ai-variance-memo/](../05-requirements/req-0004-ai-variance-memo/) |
| `REQ-0005` | Go 原生 Financial MCP Server 核心工具集 / Go Native Financial MCP Server Core Tools | `SRC-0001` | 开放中枢 / MCP Hub | defined | P0 | Backend | v0.1 | `REQ-0002` | [05-requirements/req-0005-go-mcp-server/](../05-requirements/req-0005-go-mcp-server/) |
| `REQ-0006` | Excel 双向同步插件 (Office.js) 与语义公式绑定 / Excel Two-Way Sync Add-in & Semantic Formula Binding | `SRC-0021` | 表格集成 / Spreadsheet Integration | developing | P1 | PM / Fullstack | v0.2 | `REQ-0002`, `REQ-0005` | [05-requirements/req-0006-excel-sync-addin/](../05-requirements/req-0006-excel-sync-addin/) |
| `REQ-0007` | 董事会与管理层 PPT 经营分析报告一键导出 / Board & Executive Presentation PPT Auto-Generator | `SRC-0021` | 汇报交付 / Presentation & Export | developing | P1 | Fullstack / AI | v0.2 | `REQ-0002`, `REQ-0004` | [05-requirements/req-0007-executive-presentation-generator/](../05-requirements/req-0007-executive-presentation-generator/) |
| `REQ-0008` | 多行业财务 BP 预置指标包与沙盘推演模板库 / Multi-Industry FBP Pre-built Metric Packs & Canvas Templates | `SRC-0022` | 预置领域资产 / Industry Packs | developing | P1 | PM / Content | v0.2 | `REQ-0002`, `REQ-0003` | [05-requirements/req-0008-multi-industry-fbp-templates/](../05-requirements/req-0008-multi-industry-fbp-templates/) |
| `REQ-0009` | 纯正黑白灰金融设计系统与三栏指挥作战台 / Monochrome Neutral Financial Design System & 3-Pane Command Workbench | `SRC-0023`, `SRC-0002`, `SRC-0003` | 交互架构 / UI/UX & Cockpit | developing | P0 | Frontend / Fullstack | v0.1 | `REQ-0002`, `REQ-0003`, `REQ-0004` | [05-requirements/req-0009-command-workbench-uiux/](../05-requirements/req-0009-command-workbench-uiux/) |

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

