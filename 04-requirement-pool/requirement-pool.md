# 需求池

| 需求 ID | 需求名称 | 来源 | 所属模块 | 状态 | 优先级 | 负责人 | 目标版本 | 前置依赖 | 工作包 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `REQ-0001` | 智能通用财务 Excel/CSV 拖拽入库与 Fact 映射 | `SRC-0001` | 数据接入 | defined | P0 | PM / Eng | v0.1 | 无 | [05-requirements/req-0001-smart-file-ingestion/](../05-requirements/req-0001-smart-file-ingestion/) |
| `REQ-0002` | 声明式语义指标计算引擎与多维 P&L 报表 | `SRC-0001` | 计算引擎 | defined | P0 | Eng | v0.1 | `REQ-0001` | [05-requirements/req-0002-semantic-metric-engine/](../05-requirements/req-0002-semantic-metric-engine/) |
| `REQ-0003` | React Flow 驱动因果沙盘画布与 What-If 模拟 | `SRC-0001` | 画布推演 | defined | P0 | Frontend | v0.1 | `REQ-0002` | [05-requirements/req-0003-whatif-driver-canvas/](../05-requirements/req-0003-whatif-driver-canvas/) |
| `REQ-0004` | 自主 Finance BP 方差分析 Memo 与数字穿透审计 | `SRC-0001` | AI 智能 | defined | P0 | AI / Fullstack | v0.1 | `REQ-0002` | [05-requirements/req-0004-ai-variance-memo/](../05-requirements/req-0004-ai-variance-memo/) |
| `REQ-0005` | Go 原生 Financial MCP Server 核心工具集 | `SRC-0001` | 开放中枢 | defined | P0 | Backend | v0.1 | `REQ-0002` | [05-requirements/req-0005-go-mcp-server/](../05-requirements/req-0005-go-mcp-server/) |

## 字段规则
- 来源填写 `SRC-XXXX`，回溯原始输入。
- 状态使用 `00-rules/status-and-gates.md` 中的定义。
- 优先级使用 `P0/P1/P2/P3`，必须说明判断依据。
- 目标版本表示当前计划；版本承诺以 `06-versions/<version>/scope.md` 为准。
