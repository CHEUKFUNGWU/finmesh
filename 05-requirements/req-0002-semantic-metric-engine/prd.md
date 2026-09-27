# REQ-0002: 声明式语义指标计算引擎与多维 P&L 报表 / Declarative Semantic Metric Engine & Multi-dim P&L PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0002`
- **需求名称**：声明式语义指标计算引擎与多维 P&L 报表生成
- **关联来源**：`SRC-0001`（访谈轮次 3、6、9）、`SRC-0014`（DuckDB 列式计算与透视函数）、`SRC-0015`（dbt 声明式建模思想）
- **所属模块**：计算引擎 (Compute Engine)
- **目标版本**：`v0.1`
- **生命周期状态唯一维护位置**：[04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **前置依赖**：`REQ-0001`（需要底层 Fact 事实表数据支持）
- **责任人**：Eng (Backend / Systems)

---

### 2. 业务背景与用户痛点
财务规划与分析（FP&A）的日常核心产出是多维损益表（P&L）与指标监控看板：
1. `[已观察]` **指标口径撕裂**：不同业务部门对同一指标（如 ARR、毛利率、获客成本）计算公式不一，导致月结管理会议沦为口径争论（来源：`SRC-0001`）。
2. `[已观察]` **大模型直接计算幻觉**：若让 LLM 自由书写 SQL 或口算指标，极易出现除零错误、多表连接字段漂移与不可重复的算术误差（来源：`SRC-0001`）。
3. `[推断]` **透视与版本对比笨重**：传统数仓多版本同屏对比编写繁琐，采用 DuckDB 内存聚合与 CTE 编译可将交互延迟控制在毫秒级。
4. `[待确认]` **跨法人合并抵消规则**：多子公司集团内部往来交易抵消规则的复杂度，需在后续跨主体试点中评估。
5. `[未覆盖]` **双准则自动转换**：本需求聚焦管理报表与标准 P&L，全自动 GAAP/IFRS 差异调整引擎由后续里程碑承载。

**目标**：构建基于 Go + DuckDB 的声明式语义指标计算引擎。通过 YAML 统一指标定义，将用户查询动态编译为严谨确定性的 DuckDB SQL，并在毫秒级完成多版本 P&L 透视表生成。

---

### 3. 用户故事 (User Stories)
- **US-01 (CFO / 管理层)**：作为 CFO，我希望在工作台秒级查看 12 个月的标准 P&L 报表，包括收入、营业成本、毛利率、三费（研发/销售/管理）、净利润与现金跑道，并能自由切换 Actual、Budget 与 Forecast 版本进行横向对比。
- **US-02 (财务分析师)**：作为财务分析师，我希望通过统一的 YAML 规范声明自定义指标（如 `net_burn`、`runway_months`、`ltv_cac_ratio`），系统自动解析依赖树并安全执行计算，无需手动拼装复杂 SQL。
- **US-03 (系统开发人员)**：作为后端开发人员，我希望语义引擎支持本地 LRU 缓存，在底层 Fact 数据未发生变更时，重复指标查询直接从内存返回，响应时间 $< 10\text{ms}$。

---

### 4. 功能性需求与技术实现标准

#### 4.1 声明式语义指标规范 (YAML Schema)
引擎支持解析如下标准 YAML 指标清单，并在系统启动时完成语法校验与 DAG 依赖环路检测：

```yaml
version: 1
metrics:
  - name: revenue
    display_name: Total Revenue
    category: Revenue
    base_table: fact_general_ledger
    formula: "SUM(credit_amount) - SUM(debit_amount)"
    default_filter: "account_category = 'Revenue'"
    dimensions: [department_id, entity_id, posting_date]

  - name: cogs
    display_name: Cost of Goods Sold
    category: Profitability
    base_table: fact_general_ledger
    formula: "SUM(debit_amount) - SUM(credit_amount)"
    default_filter: "account_category = 'COGS'"
    dimensions: [department_id, entity_id, posting_date]

  - name: gross_profit
    display_name: Gross Profit
    category: Profitability
    formula: "revenue - cogs"
    derived_from: [revenue, cogs]

  - name: gross_margin_pct
    display_name: Gross Margin (%)
    category: Profitability
    formula: "(gross_profit / NULLIF(revenue, 0)) * 100"
    derived_from: [gross_profit, revenue]

  - name: net_burn
    display_name: Monthly Net Burn
    category: CashFlow
    base_table: fact_general_ledger
    formula: "SUM(debit_amount) - SUM(credit_amount)"
    default_filter: "account_category IN ('OPEX_RD', 'OPEX_SM', 'OPEX_GA', 'COGS') AND account_category != 'Revenue'"

  - name: runway_months
    display_name: Cash Runway (Months)
    category: Solvency
    formula: "latest_cash_balance / NULLIF(avg_3m_net_burn, 0)"
    derived_from: [latest_cash_balance, avg_3m_net_burn]
```

#### 4.2 SQL 编译与执行管线
1. **依赖解析 (Dependency Resolution)**：对派生指标（`derived_from`）进行拓扑排序，按需组装 CTE（Common Table Expressions）或子查询。
2. **安全参数化与租户隔离**：在查询语句中强制限定租户数据库作用域，参数化注入时间窗口（`start_date`, `end_date`）与情景维度（`scenario_id`）。
3. **透视报表生成 (PIVOT/UNPIVOT)**：利用 DuckDB 原生 `PIVOT` 语法，将按月聚合的数值列动态旋转为横向月份列（Jan ~ Dec），输出标准财务多维网格结构。

#### 4.3 多情景差异对比 (Scenario Variance Engine)
支持一键对比两个情景版本（如 `Actuals_2026` vs `Budget_2026_v1`）：
- **绝对差额 (Absolute Variance)**：$\Delta = \text{Actual} - \text{Budget}$
- **相对比率 (Percentage Variance)**：$\% \Delta = \frac{\text{Actual} - \text{Budget}}{|\text{Budget}|} \times 100\%$

---

### 5. 验收标准与测试用例 (Acceptance Criteria)

- [ ] **AC-01 (YAML 语法加载与循环依赖拦截)**：加载存在循环依赖的指标定义（如 A 依赖 B，B 依赖 A），引擎在启动时报错拒绝，显式输出 `Circular dependency detected: A -> B -> A`。
- [ ] **AC-02 (P&L 损益表秒级透视)**：对包含 10 万条 GL 分录的租户数据库请求 12 个月损益表，全量计算与横向透视耗时 $\le 100\text{ms}$。
- [ ] **AC-03 (零除与空值防御)**：当 Revenue 为 0 时，请求 `gross_margin_pct` 正确返回 `NULL` 或 0.00%，严禁报底层数据库崩溃或除零异常。
- [ ] **AC-04 (预实差异对比输出)**：请求 `Actual vs Budget` 对比，返回的数据结构必须包含基础值、对比值、绝对差额与相对百分比四组并列字段。

---

<a name="english"></a>
## English Specification

### 1. Basic Metadata
- **Requirement ID**: `REQ-0002`
- **Requirement Name**: Declarative Semantic Metric Engine & Multi-dimensional P&L Schedule
- **Associated Sources**: `SRC-0001` (Grill-me Rounds 3, 6, 9), `SRC-0014` (DuckDB OLAP & PIVOT), `SRC-0015` (dbt declarative modeling)
- **Module**: Compute Engine
- **Target Release**: `v0.1`
- **Lifecycle Status Source of Truth**: [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Prerequisites**: `REQ-0001` (Requires underlying Fact schema data)
- **Owner**: Eng (Backend / Systems)

---

### 2. Business Context & Problem Statement
The primary recurring deliverable in Corporate Financial Planning & Analysis (FP&A) is the multi-dimensional Profit & Loss (P&L) schedule and KPI performance reporting:
1. `[Observed]` **Metric Definition Divergence**: Inconsistent metric formulas (ARR, Gross Margin, CAC) across departments spark unproductive alignment debates during month-end closes (Source: `SRC-0001`).
2. `[Observed]` **Generative LLM Arithmetic Hallucinations**: Direct LLM SQL generation yields join drift and irreproducible math inaccuracies (Source: `SRC-0001`).
3. `[Inferred]` **Rigid Pivot & Scenario Comparison**: Conventional warehouses struggle with sub-second latency; compiling DAGs into DuckDB CTEs achieves millisecond-grade responsiveness.
4. `[To-Confirm]` **Intercompany Elimination Complexity**: Elimination rules across multi-subsidiary corporate entities to be calibrated in cross-entity pilots.
5. `[Uncovered]` **Automated Dual-GAAP/IFRS Conversion**: Automated regulatory reconciliations are reserved for future milestone scoping.

**Goal**: Build a declarative semantic metric engine in Go + DuckDB. Standardizing metric formulas via YAML, the engine dynamically compiles user queries into deterministic DuckDB SQL, delivering multi-scenario financial P&L pivot schedules in milliseconds.

---

### 3. User Stories
- **US-01 (CFO / Leadership)**: As a CFO, I want to load a 12-month standard P&L schedule in sub-seconds—displaying Revenue, COGS, Gross Margin, OPEX (R&D/S&M/G&A), Net Income, and Cash Runway—with the ability to switch between Actuals, Budget, and Forecast versions for instant variance comparisons.
- **US-02 (Finance Analyst)**: As a finance analyst, I want to declare custom metrics (`net_burn`, `runway_months`, `ltv_cac_ratio`) in a standardized YAML catalog, so that the engine resolves the dependency DAG and executes calculations safely without manual SQL assembly.
- **US-03 (Systems Engineer)**: As an engineer, I want the semantic engine to leverage an in-memory LRU cache, returning repeated metric queries directly from memory in $< 10\text{ms}$ when fact tables are unchanged.

---

### 4. Functional Specifications & Engineering Standards

#### 4.1 Declarative Semantic Metric Schema (YAML)
The engine validates the metric catalog on startup, enforcing DAG acyclicity:

```yaml
version: 1
metrics:
  - name: revenue
    display_name: Total Revenue
    category: Revenue
    base_table: fact_general_ledger
    formula: "SUM(credit_amount) - SUM(debit_amount)"
    default_filter: "account_category = 'Revenue'"
    dimensions: [department_id, entity_id, posting_date]

  - name: cogs
    display_name: Cost of Goods Sold
    category: Profitability
    base_table: fact_general_ledger
    formula: "SUM(debit_amount) - SUM(credit_amount)"
    default_filter: "account_category = 'COGS'"
    dimensions: [department_id, entity_id, posting_date]

  - name: gross_profit
    display_name: Gross Profit
    category: Profitability
    formula: "revenue - cogs"
    derived_from: [revenue, cogs]

  - name: gross_margin_pct
    display_name: Gross Margin (%)
    category: Profitability
    formula: "(gross_profit / NULLIF(revenue, 0)) * 100"
    derived_from: [gross_profit, revenue]

  - name: net_burn
    display_name: Monthly Net Burn
    category: CashFlow
    base_table: fact_general_ledger
    formula: "SUM(debit_amount) - SUM(credit_amount)"
    default_filter: "account_category IN ('OPEX_RD', 'OPEX_SM', 'OPEX_GA', 'COGS') AND account_category != 'Revenue'"

  - name: runway_months
    display_name: Cash Runway (Months)
    category: Solvency
    formula: "latest_cash_balance / NULLIF(avg_3m_net_burn, 0)"
    derived_from: [latest_cash_balance, avg_3m_net_burn]
```

#### 4.2 SQL Compilation & Execution Pipeline
1. **DAG Topological Sort**: Resolves derived metrics (`derived_from`), assembling CTEs (Common Table Expressions) sequentially.
2. **Tenant Scoping & Parameter Injection**: Scopes queries to the tenant's isolated DuckDB file, injecting time bounds (`start_date`, `end_date`) and scenario identifiers (`scenario_id`).
3. **Pivot Table Transformation**: Leverages DuckDB native `PIVOT` syntax to transform month-aggregated rows into horizontal monthly columns (Jan ~ Dec).

#### 4.3 Multi-Scenario Variance Computation
Calculates variances between two selected scenarios (e.g., `Actuals_2026` vs `Budget_2026_v1`):
- **Absolute Delta**: $\Delta = \text{Actual} - \text{Budget}$
- **Percentage Variance**: $\% \Delta = \frac{\text{Actual} - \text{Budget}}{|\text{Budget}|} \times 100\%$

---

### 5. Acceptance Criteria & Test Cases

- [ ] **AC-01 (YAML Validation & Cycle Detection)**: Loading a catalog with circular dependencies (A -> B -> A) triggers startup failure with error `Circular dependency detected: A -> B -> A`.
- [ ] **AC-02 (Sub-second P&L Schedule Pivot)**: Executing a 12-month P&L schedule aggregation over 100,000 ledger rows completes in $\le 100\text{ms}$.
- [ ] **AC-03 (Zero-Division Defense)**: When Revenue equals 0, querying `gross_margin_pct` safely returns `NULL` or 0.00% without throwing database exceptions.
- [ ] **AC-04 (Scenario Variance Output)**: Querying `Actual vs Budget` yields side-by-side output containing base value, comparison value, absolute delta, and percentage delta.
