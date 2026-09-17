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

