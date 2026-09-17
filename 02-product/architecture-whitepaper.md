# FinMesh 架构与产品白皮书

> 面向 FP&A 与财务 BP 的业财协同与沙盘推演系统，提供分析工作台与 MCP 接口。

---

## 目录

- [1. 产品定位与解决问题](#1-产品定位与解决问题)
- [2. 目标客群与痛点解法 (ICP)](#2-目标客群与痛点解法-icp)
- [3. 核心交互模式](#3-核心交互模式)
- [4. 系统整体架构与技术选型](#4-系统整体架构与技术选型)
- [5. 数值确定性与审计穿透](#5-数值确定性与审计穿透)
- [6. 业财数据模型与声明式指标层](#6-业财数据模型与声明式指标层)
- [7. Financial MCP Server 规范](#7-financial-mcp-server-规范)
- [8. 技术栈清单](#8-技术栈清单)
- [9. MVP 交付范围与开发路线图](#9-mvp-交付范围与开发路线图)

---

## 1. 产品定位与解决问题

企业财务规划与分析（FP&A）及业务财务伙伴（Finance BP）日常面临三项主要限制：
1. **数据口径割裂**：总账科目（GL）、业务系统订单（Stripe/Shopify/CRM）与人事编制表格口径不一，月结时分析师需要耗费大量时间手工清洗与核对跨系统表格。
2. **模型维护困难**：传统电子表格公式容易破损，复杂的跨期测算难以响应管理层实时的“What-If”沙盘推演需求。
3. **大模型计算幻觉**：大模型直接做数值计算容易出现心算偏差，且缺少数据溯源链路，无法满足审计与管理层核验要求。

**FinMesh 的定位**：
FinMesh 是一套面向财务分析与业务协同的软件系统。系统基于确定性 SQL 计算，提供图形化因果沙盘与结构化归因分析，同时通过标准 MCP 协议向外部智能体暴露财务指标查询与推演能力。

---

## 2. 目标客群与痛点解法 (ICP)

FinMesh 兼顾成长期企业（Scale-up / Mid-Market）与中小企业（SMB）：

| 维度 | Scale-up / Mid-Market (100 - 1000 人) | 高成长 SMB / 出海企业 (< 100 人) |
| :--- | :--- | :--- |
| **典型特征** | 业务迭代快、设专职 Finance BP，需要跨部门协同 | 追求轻量精简、即插即用、重视现金流与跑道控制 |
| **核心痛点** | 跨部门数据口径不一、预实偏差（Variance）分析耗时长、预算审批流程复杂 | 缺少专职财务分析师、表格模板混乱、难以实时掌握现金流健康度 |
| **FinMesh 解法** | 自动生成方差归因瀑布图（Waterfall）、多维权限隔离、标准 API 与数仓连接 | 拖拽文件批量入库、内置标准 SaaS/电商指标模板、实时现金跑道监控 |

---

## 3. 核心交互模式

系统提供三项联动的工作流模块：

```mermaid
graph LR
    A[多维业财分析网格<br/>P&L Multi-dim Grid] <--> B[因果沙盘画布<br/>React Flow What-If Canvas]
    B <--> C[经营分析备忘录<br/>AI Memo & Waterfall]
    C <--> A
```

### 3.1 因果沙盘画布 (Visual What-If Driver Canvas)
- 基于 React Flow 构建因果驱动有向无环图（DAG）。
- 历史期节点绑定底层事实表（Actuals）；未来预测期节点转化为带有数值滑块的驱动因子。
- 调整滑块数值（如“获客成本调整 +15%”或“推迟 2 个月招聘”），系统在 100ms 内重算损益表与现金跑道，并支持 Base、Bull、Bear 三种情景同屏对比。

### 3.2 多维业财分析网格 (Dynamic Financial Grid)
- 基于 AG Grid 构建的多维报表视图，保留类似 Excel 的操控习惯。
- 支持行列切片（Slice & Dice）、层级折叠、版本对比（Actual vs Budget / Forecast），并支持双向 Excel / Google Sheets 导出与导入。

### 3.3 经营分析备忘录与归因 (Executive Memo & Variance Diagnosis)
- 月结时自动运行量价方差分解，定位根本驱动因子（价量差异、部门超支、转化漏斗变动），生成带 Waterfall 瀑布图与业务建议的文字备忘录。
- **数字穿透审计**：文档中的所有数值均带有原始数据链接，点击可打开抽屉查看对应的 SQL 查询与明细账分录。

---

## 4. 系统整体架构与技术选型

FinMesh 采用 **Go 核心系统 + Python 算法插件 + 租户隔离 DuckDB 存储 + Next.js 前端** 架构：

```mermaid
flowchart TB
    subgraph ClientLayer ["表现层 (Client & Agent Layer)"]
        WebUI["Next.js Web 工作台\n(React Flow 画布 + AG Grid + ECharts)"]
        ExternalAgent["外部 AI Agent\n(Claude Desktop / Cursor / 企业内部 Bot)"]
        ExcelAddin["Excel / Google Sheets\n双向插件与数据导出"]
    end

    subgraph GatewayLayer ["接入与协议层 (Gateway & Protocol Layer)"]
        APIGateway["Go API 网关\n(REST / WebSocket / SSE 流式传输)"]
        MCPServer["Go 原生 MCP Server\n(Remote SSE/HTTP + Local Stdio Bridge)"]
    end

    subgraph GoCore ["Go SaaS 核心后端与 AI 调度中枢 (FinMesh Core)"]
        AuthTenant["多租户与组织权限 (RBAC)"]
        DataIngestion["数据集成流水线\n(CSV/Excel 解析器 + API 连接器)"]
        SemanticEngine["声明式语义指标层 (Semantic Metric Engine)"]
        LLMOrchestrator["模型中立网关\n(OpenAI/Anthropic-compatible / Response API / 自托管模型)"]
        DuckDBManager["DuckDB 租户隔离驱动引擎\n(go-duckdb)"]
    end

    subgraph PythonSidecar ["Python 算法微服务插件 (Sidecar)"]
        ProphetService["时间序列预测 (Prophet / StatsForecast)"]
        MonteCarloService["蒙特卡洛模拟"]
        DocOCRService["非结构化财报凭证解析"]
    end

    subgraph StorageLayer ["数据与持久化层 (Storage Layer)"]
        PGMetadata["PostgreSQL\n(组织、用户、权限、语义模型元数据)"]
        TenantDuckDB["租户专属 DuckDB 加密文件\n(fact_gl, fact_revenue, fact_headcount, fact_drivers)"]
        ObjectStorage["S3 / R2 对象存储\n(原始凭证、文件快照、生成的 PDF/PPT)"]
    end

    WebUI --> APIGateway
    ExternalAgent --> MCPServer
    ExcelAddin --> APIGateway

    APIGateway --> GoCore
    MCPServer --> GoCore

    GoCore <--> PGMetadata
    GoCore <--> TenantDuckDB
    GoCore <--> ObjectStorage
    GoCore <--> PythonSidecar
```

### 4.1 架构设计考量
- **并发性能与资源占用**：Go 语言具有低内存占用与高并发特性，处理 SaaS 业务逻辑、数据调度与 MCP 通信。
- **内存列式计算**：底层计算使用 DuckDB，通过列式矢量执行完成千万级交易明细的即时聚合。
- **租户物理级文件隔离**：每个企业租户使用独立的加密 DuckDB 文件，从存储层避免跨租户 SQL 查询数据泄漏风险。
- **算法微服务插件**：通过 Python Sidecar 提供 Prophet 时间序列与蒙特卡洛算法扩展能力。

---

## 5. 数值确定性与审计穿透

系统建立明确的防幻觉与审计追踪机制：

```mermaid
sequenceDiagram
    autonumber
    actor User as CFO / Finance BP
    participant WebUI as Next.js 页面 / Memo
    participant GoCore as Go 调度中枢
    participant LLM as 推理模型 (OpenAI/Anthropic-compatible)
    participant Semantics as 语义指标目录
    participant DuckDB as 租户专属 DuckDB

    User->>WebUI: 提问: "为什么 Q2 毛利率比预算低了 3.2%？"
    WebUI->>GoCore: 发起异动归因请求
    GoCore->>Semantics: 提取 gross_margin 相关指标定义与 Fact 关联
    GoCore->>LLM: 注入上下文与结构化 SQL Prompt
    LLM-->>GoCore: 返回确定性参数与分析框架 SQL
    GoCore->>DuckDB: 执行价量分解与方差分析查询 (SQL)
    DuckDB-->>GoCore: 返回严谨计算结果 (Price Variance: -$120K, Volume Variance: +$45K)
    GoCore->>LLM: 注入真实计算结果，要求撰写分析陈述（禁止修改任何数值）
    LLM-->>GoCore: 生成包含格式化引用标记的 Memo
    GoCore-->>WebUI: 渲染 Memo (文本中的 $120K 自动生成数字下钻卡片)
    User->>WebUI: 点击数字 $120K
    WebUI->>DuckDB: 请求底层交易清单与 SQL 证据链
    DuckDB-->>WebUI: 弹出数据抽屉展示 32 条客户调价流水
```

### 防幻觉设计规则：
1. **禁止大模型直接做数值运算**：所有求和、同比、环比、比率计算均在 DuckDB 内由确定性 SQL 执行。
2. **声明式语义约束**：指标计算公式在语义层统一维护，模型只负责意图解析与参数提取。
3. **数字可穿透追溯**：自动生成的文字备忘录中的数值均附带查询参数，可随时调出底层凭证。

---

## 6. 业财数据模型与声明式指标层

### 6.1 标准 Fact 事实表（存储于 DuckDB）
- **`fact_general_ledger`**：总账科目流水（日期、科目编码、借贷方向、金额、部门、币种、摘要）。
- **`fact_revenue_movements`**：业务/SaaS 收入异动（客户 ID、变动类型 New/Expansion/Churn、MRR/ARR、产品）。
- **`fact_headcount_roster`**：人员编制与成本（员工、岗位、部门、入离职日期、综合人头成本）。
- **`fact_operational_metrics`**：业务驱动指标（网站流量、线索数、转化率、单客成本等）。
- **`dim_scenario`**：情景维度（Actual, Budget_v1, Forecast_Q3, WhatIf_Bull 等）。

### 6.2 声明式指标定义样例 (YAML 规范)
```yaml
version: 1
metrics:
  - name: arr
    display_name: Annual Recurring Revenue
    category: Revenue
    formula: "SUM(arr_amount)"
    base_table: fact_revenue_movements
    default_filter: "movement_type != 'Churn'"
    dimensions: [customer_id, product_id, date]

  - name: gross_margin_pct
    display_name: Gross Margin (%)
    category: Profitability
    formula: "(SUM(revenue) - SUM(cogs)) / NULLIF(SUM(revenue), 0) * 100"
    derived_from: [revenue, cogs]

  - name: net_burn
    display_name: Monthly Net Burn
    category: CashFlow
    formula: "SUM(operating_expenses) + SUM(cogs) - SUM(revenue)"
    
  - name: runway_months
    display_name: Cash Runway (Months)
    category: Solvency
    formula: "latest_cash_balance / NULLIF(avg_3m_net_burn, 0)"
```

---

## 7. Financial MCP Server 规范

FinMesh 原生集成 Model Context Protocol (MCP)，外部 Agent（如 Claude Desktop、Cursor 或企业内部 Bot）可通过标准协议调取系统能力：

### 核心 MCP Tools 清单：
1. `query_financial_metric`：
   - 参数：`workspace_id`, `metric_name`, `start_date`, `end_date`, `group_by`, `scenario`
   - 返回：时间序列计算数值、指标定义公式、底层执行的 SQL。
2. `explain_variance`：
   - 参数：`workspace_id`, `metric_name`, `base_scenario`, `compare_scenario`, `period`
   - 返回：自动化方差分解结果（如价量差异、部门贡献归因排序）。
3. `simulate_scenario`：
   - 参数：`workspace_id`, `driver_overrides`（如 `{"cpm_growth": 0.1, "hiring_delay_months": 3}`）
   - 返回：推演后的 P&L 变化表与现金跑道天数增减。
4. `drill_down_transactions`：
   - 参数：`workspace_id`, `metric_name`, `filters`, `limit`
   - 返回：支撑该数值的底层原始交易明细。

---

## 8. 技术栈清单

- **Frontend**: Next.js 15+ (App Router, React 19, TypeScript), Tailwind CSS, Shadcn UI, React Flow (`@xyflow/react`), AG Grid Community, Apache ECharts.
- **Backend (Core SaaS & MCP)**: Go (Golang 1.23+), Gin/Echo, `go-duckdb`, `mcp-go`, GORM/SQLX.
- **Python Sidecar**: Python 3.11+, FastAPI, Prophet, StatsForecast.
- **Databases & Storage**: DuckDB (嵌入式列式分析), PostgreSQL 16 (关系元数据与权限), Valkey/Redis (缓存与任务队列).
- **LLM Gateway**: 支持 OpenAI-compatible API、Anthropic-compatible API、Response API 以及本地/云端自托管模型（如 vLLM / Ollama）。

---

## 9. MVP 交付范围与开发路线图

### 阶段一：端到端垂直切片 MVP (当前重点)
- [x] 完成整体产品定义与核心架构推演 (`/grill-me`)
- [ ] 搭建 Go 后端基础骨架并集成 `go-duckdb`
- [ ] 实现标准财务 CSV/Excel（GL 总账、收入流水）拖拽入库与 DuckDB 事实表写入
- [ ] 实现声明式语义指标计算引擎（基础 P&L 核心指标）
- [ ] 实现 Go 原生 MCP Server（支持指标查询与方差归因工具）
- [ ] 搭建 Next.js 前端工作台（P&L 多维网格 + React Flow 驱动沙盘 + 穿透备忘录）
- [ ] 端到端实测数据平衡性与穿透下钻证据链

### 阶段二：集成拓展与双向联动
- [ ] 接入 QuickBooks, Xero, Stripe API 直接同步
- [ ] 开放 Excel / Google Sheets 双向同步插件
- [ ] 引入 Python Sidecar 支持 Prophet 时间序列趋势预测
