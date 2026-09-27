# REQ-0005: Go 原生 Financial MCP Server 核心工具集 / Go Native Financial MCP Server Core Tools PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0005`
- **需求名称**：Go 原生 Financial MCP Server 核心工具集
- **关联来源**：`SRC-0001`（访谈轮次 6、8、10）、`SRC-0009`（Model Context Protocol Go SDK）、`SRC-0014`（DuckDB 列式查询优化）
- **所属模块**：开放中枢 (MCP Hub & Integrations)
- **目标版本**：`v0.1`
- **生命周期状态**：`defined`（以 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md) 为准）
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供指标目录与计算接口）
- **责任人**：Eng (Backend / Systems)

---

### 2. 业务背景与用户痛点
在金融企业多智能体（Multi-Agent）与协作生态中：
1. **财务数据割裂成信息孤岛**：外部 AI 工具（如 Claude Desktop、Cursor、企业私有智能体群）无法安全、标准地调阅企业内部财务指标与报表。
2. **非标 API 增加集成成本**：每接入一个新的外部 Agent 平台，都需要定制开发专属适配器，缺乏行业标准协议支撑。
3. **运行时笨重与内存占用大**：许多 Python/Node 编写的 MCP 服务冷启动时间长、常驻内存过高（数百 MB），难以在边缘或资源受限环境中高并发运行。

**目标**：基于 Go 原生开发轻量级 Financial MCP Server（基于 `mark3labs/mcp-go`）。支持标准 `stdio` 与 `sse` 双通信传输模式，向外部 Agent 开放标准化财务工具集（指标查询、方差解释、凭证穿透与推演重算），内存占用 $< 30\text{MB}$，查询耗时 $< 20\text{ms}$。

---

### 3. 用户故事 (User Stories)
- **US-01 (智能体开发者)**：作为 AI 工程师，我希望通过标准的 MCP 协议将 FinMesh 作为 Tool Provider 接入企业内部的多智能体编排网络，让 Agent 能够安全调用确定性财务计算能力。
- **US-02 (CFO / 分析师)**：作为分析师，我希望在本地 IDE（如 Cursor）或桌面端 Agent（如 Claude Desktop）中直接向助手提问：“查询 2026 年第一季度的毛利率与上年同期的方差”，Agent 自动通过 MCP 工具调取准确计算结果。
- **US-03 (系统安全管理员)**：作为安全官，我希望 MCP 服务具备严格的租户隔离、只读权限沙箱与每笔调用的审计日志（包含调用方标识、工具入参、执行耗时与返回数据行数），防止财务敏感数据泄露。

---

### 4. 功能性需求与技术实现标准

#### 4.1 通信传输模式 (Transport Modes)
系统支持两种标准的 MCP 传输协议：
1. **Stdio 模式**：通过标准输入输出交互，专用于本地宿主程序（Claude Desktop、Cursor、命令行 Agent），即启即用，零端口暴露。
2. **SSE 模式 (Server-Sent Events over HTTP)**：专用于云端多租户微服务集群与分布式 Agent 调度中心，支持鉴权 Token 校验与长连接保活。

#### 4.2 核心 MCP 工具集定义 (Core Tools Schema)
Server 暴露以下 5 个核心生产级工具：

```go
package mcp

// FinancialToolDefinitions defines standard schemas for AI agent invocation
var CoreTools = []ToolDefinition{
    {
        Name:        "query_financial_metric",
        Description: "Query deterministic financial metrics (e.g. revenue, cogs, gross_margin) from the semantic catalog across periods and scenarios.",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "metric_name": map[string]string{"type": "string", "description": "Catalog metric name"},
                "scenario":    map[string]string{"type": "string", "enum": "actual,budget,forecast"},
                "period":      map[string]string{"type": "string", "description": "Quarter or month format (e.g. 2026-Q1, 2026-03)"},
                "dimensions":  map[string]string{"type": "array", "description": "Optional group-by dimensions like department_id"},
            },
            "required": []string{"metric_name", "scenario", "period"},
        },
    },
    {
        Name:        "get_metric_catalog",
        Description: "Introspect all registered financial metrics, display labels, categories, and algebraic calculation formulas.",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "category": map[string]string{"type": "string", "description": "Optional category filter: Revenue, Profitability, Opex, KPI"},
            },
        },
    },
    {
        Name:        "explain_variance",
        Description: "Compute Price-Volume-Mix (PVM) mathematical variance breakdown between baseline and comparison scenarios.",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "metric_name": map[string]string{"type": "string"},
                "baseline":    map[string]string{"type": "string", "description": "e.g. budget_2026_q1"},
                "comparison":  map[string]string{"type": "string", "description": "e.g. actual_2026_q1"},
            },
            "required": []string{"metric_name", "baseline", "comparison"},
        },
    },
    {
        Name:        "drilldown_transaction_ledger",
        Description: "Fetch underlying general ledger transaction vouchers contributing to a specific metric for audit verification.",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "metric_name": map[string]string{"type": "string"},
                "period":      map[string]string{"type": "string"},
                "limit":       map[string]string{"type": "integer", "description": "Max rows to return (default: 20)"},
            },
            "required": []string{"metric_name", "period"},
        },
    },
    {
        Name:        "simulate_whatif",
        Description: "Simulate cascaded metric impact across the driver DAG given parameter percentage or absolute adjustments.",
        Parameters: map[string]interface{}{
            "type": "object",
            "properties": map[string]interface{}{
                "scenario_id": map[string]string{"type": "string"},
                "adjustments": map[string]string{"type": "object", "description": "Key-value map of driver adjustments (e.g. {'churn_rate': -0.02})"},
            },
            "required": []string{"scenario_id", "adjustments"},
        },
    },
}
```

#### 4.3 性能与安全硬性规范
- **内存占用**：单进程常驻物理内存 $< 30\text{MB}$。
- **并发能力**：单节点支持 $\ge 1,000\text{ QPS}$ 的只读指标查询并发。
- **只读沙箱**：MCP Server 仅向底层 DuckDB 发起只读事务连接（`duckdb.Open("?access_mode=read_only")`），杜绝任何数据越权篡改。
- **全链路审计**：每次工具调用自动记录调用方 ID、入参哈希、返回行数、执行耗时及 DuckDB 查询指纹。

---

### 5. 验收标准 (Acceptance Criteria)
1. **双协议互通**：在 `stdio` 与 `sse` 模式下，5 项核心工具均可通过官方 MCP Inspector 验证套件测试。
2. **低资源消耗**：二进制打包后体积 $< 25\text{MB}$，空闲常驻内存 $< 20\text{MB}$，压力测试下内存 $< 40\text{MB}$。
3. **确定性输出**：`query_financial_metric` 与 `explain_variance` 返回的数值精度与 Go 后端计算引擎完全一致，误差为 0。
4. **安全隔离**：任何携带 SQL 注入字符或未授权跨租户参数的调用均被前置拦截，并记录审计安全日志。

---

<a name="english"></a>
## English Specification

### 1. Basic Metadata
- **Requirement ID**: `REQ-0005`
- **Requirement Name**: Go Native Financial MCP Server Core Tools
- **Originating Sources**: `SRC-0001` (Interview rounds 6, 8, 10), `SRC-0009` (Model Context Protocol Go SDK), `SRC-0014` (DuckDB columnar query performance)
- **Module**: MCP Hub & Integrations
- **Target Release**: `v0.1`
- **Lifecycle Status**: `defined` (governed in [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md))
- **Prerequisites**: `REQ-0002` (Depends on Semantic Metric Engine for metric catalog and query interfaces)
- **Owner**: Eng (Backend / Systems)

---

### 2. Business Context & User Pain Points
In enterprise multi-agent workflows and collaborative AI ecosystems:
1. **Siloed Financial Data**: External AI agents (such as Claude Desktop, Cursor, and enterprise multi-agent teams) lack standardized, secure mechanisms to access internal financial metrics.
2. **Integration Burden from Bespoke APIs**: Each new agent platform demands custom API connectors, creating maintenance overhead in the absence of open protocols.
3. **Bulky Runtime Footprint**: Python/Node-based MCP servers suffer from slow cold-starts and high memory consumption ($> 200\text{MB}$), making them ill-suited for resource-constrained edge deployments.

**Goal**: Build a lightweight Go native Financial MCP Server using `mark3labs/mcp-go`. Supporting both `stdio` and `sse` transport modes, it exposes standardized financial tools (metric queries, variance explanation, transaction drill-down, and what-if simulation) with $< 30\text{MB}$ RAM and $< 20\text{ms}$ query latency.

---

### 3. User Stories
- **US-01 (Agent Developer)**: As an AI engineer, I want to attach FinMesh as a standard MCP Tool Provider into our multi-agent orchestration graph so agents safely tap into deterministic financial compute.
- **US-02 (CFO / Analyst)**: As an analyst, I want to ask natural questions in my desktop client (e.g. Cursor or Claude Desktop) such as "Query Q1 gross margin and break down variance against budget", with the agent reliably invoking FinMesh MCP tools.
- **US-03 (Security Administrator)**: As a security officer, I want strict tenant isolation, a read-only DB sandbox, and exhaustive audit logs for every tool invocation (client identity, input parameters, execution duration, row counts).

---

### 4. Functional Requirements & Technical Implementation Standards

#### 4.1 Dual Transport Architecture
The server implements two standard MCP transport mechanisms:
1. **Stdio Mode**: Standard input/output communication for local host applications (Claude Desktop, Cursor, CLI agents) with zero network port exposure.
2. **SSE Mode (Server-Sent Events over HTTP)**: Network transport designed for cloud multi-agent swarms and distributed orchestrators, complete with bearer token authentication.

#### 4.2 Core MCP Tools Specification
The server registers 5 production-grade tools:
1. `query_financial_metric`: Query deterministic financial metrics by name, period, scenario, and dimensions.
2. `get_metric_catalog`: Inspect registered metrics, display names, categories, and formulas.
3. `explain_variance`: Compute Price-Volume-Mix (PVM) mathematical variance breakdown between two scenarios.
4. `drilldown_transaction_ledger`: Retrieve underlying GL journal voucher entries for a specific metric and period.
5. `simulate_whatif`: Run dynamic sensitivity simulations on driver trees with given parameter adjustments.

#### 4.3 Performance & Security Guardrails
- **Memory Footprint**: Process resident memory $< 30\text{MB}$.
- **Throughput**: Single-node capability $\ge 1,000\text{ QPS}$ for concurrent read-only queries.
- **Read-Only Sandbox**: Attached to DuckDB instances exclusively in read-only mode (`duckdb.Open("?access_mode=read_only")`), preventing accidental or malicious mutation.
- **Exhaustive Auditing**: Every invocation records caller ID, parameter hash, latency, returned row count, and DuckDB execution fingerprint.

---

### 5. Acceptance Criteria
1. **Protocol Conformance**: All 5 core tools pass validation against the official MCP Inspector test suite across both `stdio` and `sse` transports.
2. **Resource Efficiency**: Compiled standalone binary $< 25\text{MB}$, idle memory consumption $< 20\text{MB}$, stress-tested memory $< 40\text{MB}$.
3. **Deterministic Output**: Values returned by `query_financial_metric` and `explain_variance` match the core Go engine with zero arithmetic error.
4. **Security Enforcement**: Any query carrying SQL injection patterns or cross-tenant parameters is rejected with an audit alert.
