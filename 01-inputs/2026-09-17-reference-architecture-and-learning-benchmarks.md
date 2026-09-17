# 参考资源分析与架构借鉴规划

- **登记日期**：2026-09-17
- **关联来源**：`SRC-0002` ~ `SRC-0012`
- **目标**：梳理团队既有业财资产、Go 基础设施、MCP 协议、安全 Agent 运行时与前端设计规范，确立技术落地标准。

---

## 1. 业务与业财领域资产 (FP&A & Finance BP Domain)

### 1.1 `CHEUKFUNGWU/retail_performance_workstation`
- **项目定位**：零售经营与业财数据分析工作台。
- **已有沉淀资产**：
  - `docs/PRD_财务BP与FPA岗位支撑补齐方案.md`：定义了财务 BP 与 FP&A 的日常职责、核心指标（毛利价量归因、人效、单店模型）与支撑方案。
  - `docs/IFRS16_计量方法与准则映射白皮书.md`：会计准则映射逻辑与计量核验。
  - `docs/Agent_Tool_包装规范.md`：明确了工具接口必须窄于底层 API、租户上下文显式传递与安全隔离规则。
  - `docs/specs/fpna-chart-of-accounts-flexibility-f1.md`：FP&A 会计科目树的灵活性与层级映射方案。
- **FinMesh 借鉴方案**：
  - **工具接口设计规范**：FinMesh 暴露的 MCP Tools 遵循窄接口原则，工具入参仅包含业务语义参数，在框架层注入租户上下文。
  - **科目树动态映射**：采用其科目树层级映射方案，处理不同核算软件会计科目的统一归集。
  - **价量方差归因**：复用收入与毛利的 Price-Volume Variance 分析算法。

### 1.2 `CHEUKFUNGWU/aegisplan`
- **项目定位**：规划分析引擎与风控/财务岗位系统。
- **已有沉淀资产**：
  - `财务与风控岗位SaaS需求分析.pdf`：梳理了企业财务与风控岗位的业务流程与跨系统数据集成方式。
  - **Go 后端工程架构**：采用 `grpc-gateway`、`pgx/v5`（PostgreSQL 连接池）、`nats.go`（消息总线）。
- **FinMesh 借鉴方案**：
  - 继承其基于 `pgx/v5` 的 PostgreSQL 数据访问层。
  - 采用其在组织架构权限与多实体维度的实体抽象。

---

## 2. Go 企业级中后台与基础设施 (Go Infrastructure)

### 2.1 `go-admin-team/go-admin`
- **项目定位**：基于 Gin + GORM + Casbin 的前后端分离后台权限管理框架。
- **FinMesh 借鉴方案**：
  - **工程分层结构**：参考其 `apis/`, `models/`, `service/`, `middleware/` 目录组织。
  - **RBAC 权限控制**：基于 Casbin 实现租户内多角色（CFO、Finance BP、部门负责人、审计员）的数据与菜单权限控制。
  - **基础组件**：JWT 认证、组织架构树、API 访问限流与审计日志。

### 2.2 `youngyangyang04/KamaCache-Go`
- **项目定位**：基于 Go 语言的分布式缓存系统（一致性哈希、LRU 淘汰与并发安全控制）。
- **FinMesh 借鉴方案**：
  - **内存热点缓存**：在 Go 后端内嵌并发安全的本地缓存，对高频访问的指标定义、推演临时结果和租户元数据做内存缓存。
  - 减少高频重复查询 DuckDB 与 PostgreSQL 产生的磁盘 I/O。

---

## 3. AI Agent 运行时与 MCP 协议标准 (Agent Runtime & MCP)

### 3.1 `modelcontextprotocol/go-sdk` & `mark3labs/mcp-go`
- **项目定位**：
  - `modelcontextprotocol/go-sdk`：Anthropic 官方维护的 Go MCP SDK。
  - `mark3labs/mcp-go`：社区 Go MCP 开发框架，支持 Stdio 与 Remote SSE/HTTP 传输。
- **FinMesh 借鉴方案**：
  - 采用 `mark3labs/mcp-go` 构建 FinMesh 原生 Financial MCP Server。
  - 规范定义 Tools（指标查询与方差计算）、Resources（只读模型定义）与 Prompts（分析模版）。

### 3.2 `nanocoai/nanoclaw`
- **项目定位**：容器隔离的 AI Agent 运行环境，包含 Agent Vault 凭证管理机制。
- **FinMesh 借鉴方案**：
  - **凭据保管机制 (Vault)**：隔离外部集成凭证，避免敏感 API Key 进入大模型上下文。
  - **通知集成**：参考其消息集成方式，支持异动预警向企业通讯工具推送。

### 3.3 `earendil-works/pi`
- **项目定位**：模块化终端 AI Agent 执行框架。
- **FinMesh 借鉴方案**：
  - **状态机循环 (Agent Loop)**：参考其 Tool 调用执行循环。
  - **差异审查循环 (Diff Loop)**：用于推演版本间的指标对比与校验。

---

## 4. 现代前端与视觉系统 (Frontend Design & UI Architecture)

### 4.1 `ui.shadcn.com`
- **项目定位**：基于 Radix UI 与 Tailwind CSS 的组件库，源码直接归属项目管理。
- **FinMesh 借鉴方案**：
  - 前端基础控件层采用 shadcn/ui（Dialog, Dropdown, Table, Sheet, Tabs, Command, Popover）。
  - 支持暗色模式与样式完全可控。

### 4.2 `vercel.com/geist/introduction`
- **项目定位**：Vercel 官方设计系统与排版体系。
- **FinMesh 借鉴方案**：
  - **高密度排版**：中性冷灰背景、1px 细边框网格、严谨字阶。
  - **等宽数字排版 (Tabular Figures / `font-mono`)**：金融表格与瀑布图中所有数值使用等宽字体，保证小数点纵向对齐。
  - **克制视觉**：避免不必要的高饱和度渐变与装饰元素。

### 4.3 `ui.spectrumhq.in`
- **项目定位**：基于 shadcn/ui 与 Framer Motion 的动效组件库。
- **FinMesh 借鉴方案**：
  - 针对 React Flow 沙盘连线、数值滚动和方差瀑布图生成等环节引入平滑的状态过渡动效。

---

## 5. 分析型计算引擎与数据转换血缘体系 (Analytical Engine & Data Modeling/Lineage)

### 5.1 `DuckDB Go Client` & `DuckDB Core Engine`
- **参考链接**：
  - [DuckDB Go Client Overview](https://duckdb.org/docs/current/clients/go/overview)
  - [DuckDB Official Documentation](https://duckdb.org/docs/current/)
- **技术定位**：
  - 进程内嵌入式列式 SQL 分析型数据库（OLAP），针对分析聚合查询进行矢量化优化。
- **FinMesh 借鉴方案**：
  - **Appender 批量插入**：使用 Go Client 的 `Appender` 接口，绕过 SQL 文本解析，实现大文件流水的高速写入。
  - **租户文件动态挂载**：使用 `ATTACH 'tenants/{tenant_id}.duckdb' AS tenant_db`，在 Go 服务中按需挂载查询，实现租户物理文件隔离。
  - **财务 SQL 特性**：
    - `PIVOT / UNPIVOT`：实现多维损益表在纵向明细账与横向月份列之间的透视转换。
    - 窗口函数：使用 `SUM(net_burn) OVER (ORDER BY posting_date)`、`LAG`、`LEAD` 计算累计现金跑道与环比差异。
    - 直接查询 Parquet：支持免导入查询外部只读 Parquet 文件。

### 5.2 `dbt-core` & `dbt-docs Lineage`
- **参考链接**：
  - [dbt-labs/dbt GitHub 仓库](https://github.com/dbt-labs/dbt)
  - [dbt Docs v2 & Lineage Graph 官方文档](https://docs.getdbt.com/docs/build/view-documentation?version=2#dbt-docs-v2)
- **技术定位**：
  - 现代数据转换与建模工具，支持声明式 SQL、依赖图编排、测试与血缘图谱。
- **FinMesh 借鉴方案**：
  - **分层建模体系**：
    1. `Staging Layer`（贴源层）：对第三方 API 提取的数据进行字段规范化。
    2. `Intermediate Layer`（中间层）：完成跨系统科目代码映射与借贷折算。
    3. `Marts Layer`（集市层）：产出 `fact_gl`、`fact_revenue`、`fact_headcount` 事实表。
  - **血缘依赖解析 (Lineage DAG)**：
    - 构建“原始凭证 -> 业财事实表 -> 语义计算指标 -> 经营报告”的拓扑图，为报告中的数字穿透提供确定性来源。
  - **数据测试机制 (Testing)**：
    - 在数据入库时执行试算平衡测试（`Debits == Credits`），测试未通过前数据不进入报表发布状态。
