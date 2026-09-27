# 版本范围承诺：v0.1 (Milestone 1) / Scope Commitment: v0.1 (Milestone 1)

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 版本基本信息
- **版本编号**：`v0.1` (Milestone 1 - 核心脚手架与垂直切片 / Foundation & Core Scaffolding)
- **基线 Commit**：`bbf0a4f`
- **状态**：已完成验证 (Verified)
- **对应需求包**：`REQ-0001`, `REQ-0002`, `REQ-0003`, `REQ-0004`, `REQ-0005`
- **主导负责人**：Tech Lead / PM

---

### 2. 交付范围承诺清单 (Scope Deliverables)

| 需求 ID | 需求名称 | 核心交付物 | 验收结果与验证记录 |
| :--- | :--- | :--- | :--- |
| **`REQ-0001`** | 智能财务 Excel/CSV 拖拽入库与 Fact 映射 | 1. Go `excelize` 流式读取与类型推断<br/>2. 借贷试算平衡前置防御（$\Delta \le 0.0001$）<br/>3. 可疑借贷凭证跟踪（`suspect_vouchers`）<br/>4. DuckDB 4 张标准事实表入库 | `[已观察]` 单元测试 `TestStreamingIngest` 100% 通过；借贷不平衡文件被拦截并返回行号。 |
| **`REQ-0002`** | 声明式语义指标计算引擎与多维 P&L 报表 | 1. YAML 声明式指标目录与 Kahn 拓扑排序<br/>2. 确定性递归 CTE SQL 编译器<br/>3. DuckDB 原生 `PIVOT` 多维损益报表引擎<br/>4. 线程安全 LRU 缓存与智能失效机制 | `[已观察]` 单元测试 `TestCompileCTE_DeterministicOrder` 保证递归 CTE 顺序绝对稳定；P&L 报表毫秒级响应。 |
| **`REQ-0003`** | React Flow 驱动因果沙盘画布与 What-If 模拟 | 1. `@xyflow/react` 交互式 DAG 画布<br/>2. BFS/DFS 环路实时拦截与防御<br/>3. 驱动因子滑块与 P&L 级联重算<br/>4. 上游边际贡献瀑布抽屉与场景 JSON 导入导出 | `[已观察]` 前端 `pnpm build` 零类型错误；画布平移缩放、节点编辑与场景切换端到端验证通过。 |
| **`REQ-0004`** | 自主 Finance BP 方差分析 Memo 与数字穿透审计 | 1. 模型中立网关（OpenAI-compatible, Anthropic-compatible, Response API, 自托管模型）<br/>2. 严格代数守恒 Price-Volume-Mix (PVM) 分解<br/>3. 零心算幻觉 `<MetricToken />` 穿透审计抽屉 | `[已观察]` PVM 代数守恒测试满足 $|\Delta_{\text{total}} - (\Delta_{\text{vol}} + \Delta_{\text{price}} + \Delta_{\text{cost}})| \le 0.01$；指标溯源抽屉展示完整 SQL 与分录明细。 |
| **`REQ-0005`** | Go 原生 Financial MCP Server 核心工具集 | 1. 基于 `mcp-go` 的 Stdio 与 SSE 双通道传输<br/>2. 5 项核心生产工具（查询指标、获取目录、解释方差、穿透分录、推演沙盘）<br/>3. 参数化查询与安全防注入防御<br/>4. 真实日历月末推算与结构化审计日志 | `[已观察]` MCP 工具集成测试全部通过；Claude Desktop 与远程 Agent 均可稳定调用。 |

---

### 3. 质量门槛与评审记录 (Quality Gates & Review Sign-off)

1. `[已观察]` **代码评审循环**：经历 4 轮严格的 Standards 与 Spec 双轴代码评审（Code Review），累计解决 15 项潜在问题，最终达成 **0 P0、0 P1、0 需修复 P2**。
2. `[已观察]` **测试与构建状态**：
   - 后端：`go test -count=1 -v ./...` 100% 绿灯。
   - 前端：Next.js 15 App Router `pnpm build` 生产构建成功，无 ESLint/TypeScript 错误。
3. `[已观察]` **架构不变式 (Invariants)**：
   - 绝不使用大模型进行财务心算；
   - 所有指标查询具备 DuckDB 确定性执行链路与完整可追溯审计凭证；
   - 模型网关协议解耦，绝不硬编码单一供应商。

---

<a name="english"></a>
## English Specification

### 1. Release Metadata
- **Version**: `v0.1` (Milestone 1 - Foundation & Core Scaffolding)
- **Baseline Commit**: `bbf0a4f`
- **Status**: Verified
- **Covered Work Packages**: `REQ-0001`, `REQ-0002`, `REQ-0003`, `REQ-0004`, `REQ-0005`
- **Owners**: Tech Lead / PM

---

### 2. Scope Deliverables Matrix

| Requirement ID | Requirement Name | Key Deliverables | Verification Record |
| :--- | :--- | :--- | :--- |
| **`REQ-0001`** | Smart Financial File Ingestion & Fact Mapping | 1. Go `excelize` streaming reader with schema inference<br/>2. Pre-flight trial balance defense ($\Delta \le 0.0001$)<br/>3. Suspect journal voucher tracking<br/>4. 4 standard DuckDB fact tables | `[Observed]` `TestStreamingIngest` passes 100%; unbalanced entries are blocked with row-level error diagnostic. |
| **`REQ-0002`** | Declarative Semantic Metric Engine & Multi-dim P&L | 1. YAML metric catalog with Kahn topological sorting<br/>2. Deterministic recursive CTE SQL compiler<br/>3. DuckDB native `PIVOT` P&L generator<br/>4. Thread-safe LRU cache with invalidation | `[Observed]` `TestCompileCTE_DeterministicOrder` guarantees deterministic CTE compilation; sub-second P&L aggregation. |
| **`REQ-0003`** | React Flow Causal Driver Canvas & What-If Sandbox | 1. `@xyflow/react` interactive DAG canvas<br/>2. Real-time BFS/DFS cycle interception<br/>3. Live driver sliders with cascaded sensitivity recomputation<br/>4. Upstream marginal waterfall drawer & scenario JSON export | `[Observed]` Next.js production build passes with zero errors; canvas interaction and scenario switching verified end-to-end. |
| **`REQ-0004`** | Autonomous Variance Memo & Audit Drill-down | 1. Protocol-neutral model gateway (OpenAI-compatible, Anthropic-compatible, Response API, self-hosted)<br/>2. Strictly conservative algebraic PVM decomposition<br/>3. Zero-hallucination `<MetricToken />` audit drawer | `[Observed]` PVM conservation test verifies $|\Delta_{\text{total}} - (\Delta_{\text{vol}} + \Delta_{\text{price}} + \Delta_{\text{cost}})| \le 0.01$; line-item drill-down displays exact SQL and vouchers. |
| **`REQ-0005`** | Go Native Financial MCP Server Core Tools | 1. `mcp-go` Stdio and SSE dual transport<br/>2. 5 production tools (query, catalog, variance, drilldown, simulate)<br/>3. Parameterized SQL security binding<br/>4. Calendar month-end dates & structured audit logging | `[Observed]` MCP integration tests pass; external Agent invocations verified. |

---

### 3. Quality Gates & Sign-off Record

1. `[Observed]` **Code Review Iterations**: Completed 4 rounds of parallel Standards and Spec code reviews, resolving 15 findings to reach **0 P0, 0 P1, 0 worth-fixing P2**.
2. `[Observed]` **Build & Test Status**:
   - Backend: `go test -count=1 -v ./...` passed (100% green).
   - Frontend: `pnpm build` passed with zero TypeScript and lint issues.
3. `[Observed]` **Architectural Invariants**:
   - Zero LLM mental math hallucination.
   - 100% deterministic DuckDB SQL with line-item transaction auditability.
   - Provider-neutral model gateway abstraction.
