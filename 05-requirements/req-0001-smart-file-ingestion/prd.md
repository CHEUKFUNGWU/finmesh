# REQ-0001: 智能财务文件拖拽入库与 Fact 事实表映射规范 / Smart Financial File Ingestion & Fact Mapping PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0001`
- **需求名称**：智能通用财务 Excel/CSV 拖拽入库与 Fact 表映射
- **关联来源**：`SRC-0001`（访谈轮次 4）、`SRC-0021`（excelize 流式读写）、`SRC-0013`（DuckDB Appender 驱动集成）、`SRC-0002`（会计科目树规范）
- **所属模块**：数据接入 (Data Ingestion)
- **目标版本**：`v0.1`
- **生命周期状态**：`defined`（以 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md) 为准）
- **责任人**：PM / Backend Engineer

---

### 2. 业务背景与用户痛点
在成长期中型企业与高成长出海 SMB 中，财务团队日常面临异构系统的“表格沼泽”：
1. **核算系统口径分散**：企业可能同时使用 QuickBooks、NetSuite、金蝶或独立银行流水，表格字段名称、日期格式（YYYY-MM-DD vs MM/DD/YYYY）、正负借贷符号千差万别。
2. **手工整理耗时易错**：分析师每月关账需花费数天人肉清洗合并跨部门 Excel，极易损坏公式且缺乏入库校验。
3. **缺乏试算平衡防御**：传统系统常在导入后才发现借贷不平或缺失关键凭证号，排查成本极高。

**目标**：提供免配置/低配置的拖拽导入管道，利用 Go 后端 `excelize` 流式解析，在进入 DuckDB 事实表前完成 100% 试算平衡校验，实现 10 分钟快速冷启动。

---

### 3. 用户故事 (User Stories)
- **US-01 (财务分析师)**：作为财务分析师，我希望将包含数万行总账分录的 CSV 或 Excel 直接拖拽上传至工作台，系统能自动识别表头并映射至标准科目，减少手工复制粘贴。
- **US-02 (财务主管/CFO)**：作为财务主管，我希望在导入数据时系统自动执行借贷试算平衡校验（`Debit == Credit`），若存在不平衡或异常格式则拦截入库并提供行级错误清单。
- **US-03 (审计员)**：作为审计员，我希望每一批导入的数据均带有唯一的 `batch_id`、上传者身份、文件 SHA-256 哈希值与原始文件名，确保所有报表数据具备防篡改溯源链。

---

### 4. 功能性需求与技术实现标准

#### 4.1 支持的数据源类型与目标 Fact 表
系统支持以下四类标准业务流水的自动识别与映射：

| 业务流水类型 | 识别特征字段 | 目标 DuckDB 事实表 | 关键约束与必填字段 |
| :--- | :--- | :--- | :--- |
| **总账科目分录** | `date`, `account_code`, `debit`, `credit`, `memo` | `fact_general_ledger` | 必须满足全批次借贷平衡；日期格式合法；凭证号存在 |
| **SaaS/商业收入流水** | `customer_id`, `mrr_amount`, `movement_type`, `date` | `fact_revenue_movements` | `movement_type` 必须枚举合法（New, Expansion, Contraction, Churn, Reactivation） |
| **人员编制与薪酬** | `employee_id`, `department_id`, `monthly_salary`, `start_date` | `fact_headcount_roster` | 薪资数值必须 > 0；部门 ID 必须有效 |
| **运营动因指标** | `metric_date`, `metric_key`, `numeric_value` | `fact_operational_metrics` | 动因 key 必须在语义目录中注册 |

#### 4.2 流式解析与内存保护
- 服务端解析器采用 Go 语言 `excelize.OpenFile` 配合 `Rows()` 流式迭代器（Streaming Reader），禁止将超大 Excel 一次性全部读入内存。
- 内存阈值：解析 50 万行 Excel 流水时，Go 进程内存增长不得超过 128 MB。

#### 4.3 预检与试算平衡防御 (Pre-flight Validation)
在写入租户 DuckDB 事实表前，强制执行以下校验链：
1. **空值与类型检查**：金额字段必须为数值型；日期字段必须能解析为有效标准时间。
2. **借贷平衡核验**：针对 `fact_general_ledger`，严格计算：
   $$\left| \sum \text{Debit} - \sum \text{Credit} \right| \le 0.0001$$
   若不平衡，立即中止写入，返回精确到分位数的差额数值及异常凭证号清单。
3. **幂等性保障**：根据文件 SHA-256 哈希与工作空间 ID 判断是否重复提交，避免重复入账。

#### 4.4 DuckDB 批量入库
- 采用 `go-duckdb` 驱动的 `Appender` 高性能 API，绕过 SQL 文本拼接与解析，直接向租户专属 DuckDB 文件追加写入。
- 写入成功后，在 PostgreSQL 元数据表中登记批次记录。

---

### 5. 验收标准与测试用例 (Acceptance Criteria)

- [ ] **AC-01 (标准 CSV 导入)**：上传符合规范的 12 个月 GL 流水 CSV（10,000 行），解析与入库在 2 秒内完成，DuckDB 中可即时执行 `SELECT COUNT(*)` 验证一致性。
- [ ] **AC-02 (借贷不平拦截)**：上传故意篡改导致借方比贷方多 $100 的文件，系统立即提示入库失败，状态码返回 422，错误信息显式标明 `Debit total $X does not balance Credit total $Y (Difference: $100.00)`。
- [ ] **AC-03 (列名模糊匹配)**：上传表头包含 `Posting Date` / `Acct Code` / `Amount Dr` 的非标准格式，智能映射器能自动推荐匹配到 `posting_date` / `account_code` / `debit_amount`，准确率 $\ge 90\%$。
- [ ] **AC-04 (批次审计回溯)**：进入审计日志，可精确查询任一已入库批次的 `batch_id`、上传人、上传时间、总行数与总借贷发生额。

---

<a name="english"></a>
## English Specification

### 1. Basic Metadata
- **Requirement ID**: `REQ-0001`
- **Requirement Name**: Smart Universal Financial Excel/CSV Drag-and-Drop Ingestion & Fact Schema Mapping
- **Associated Sources**: `SRC-0001` (Grill-me Round 4), `SRC-0021` (excelize streaming), `SRC-0013` (DuckDB Appender Integration), `SRC-0002` (COA specs)
- **Module**: Data Ingestion
- **Target Release**: `v0.1`
- **Lifecycle Status**: `defined` (canonical in [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md))
- **Owners**: PM / Backend Engineer

---

### 2. Business Context & Problem Statement
In scaling Mid-Market companies and high-growth SMBs, finance teams face heterogeneous spreadsheet swamps:
1. **Fragmented Accounting Schemas**: Disparate ERPs (QuickBooks, NetSuite, local accounting software) export files with conflicting headers, date formats (YYYY-MM-DD vs MM/DD/YYYY), and signed amounts.
2. **Error-Prone Manual Wrangling**: Analysts spend days manually normalizing and reconciling spreadsheets during month-end close, risking broken formulas and corrupted audit trails.
3. **Lack of Automated Trial Balance Defense**: Legacy tools discover unbalanced ledgers only after ingestion, generating substantial reconciliation costs.

**Goal**: Deliver a zero/low-configuration drag-and-drop ingestion pipeline in Go utilizing `excelize` streaming reader to enforce 100% trial balance verification before persisting into DuckDB fact tables.

---

### 3. User Stories
- **US-01 (Finance Analyst)**: As a finance analyst, I want to drag and drop CSV or Excel files containing tens of thousands of journal rows so that the system automatically parses headers and maps them to standard accounts, eliminating manual spreadsheet formatting.
- **US-02 (Finance Director / CFO)**: As a finance director, I want the system to automatically verify double-entry trial balance (`Debits == Credits`) upon ingestion, rejecting unbalance ledgers with line-item error diagnostics.
- **US-03 (Auditor)**: As an auditor, I want every ingested dataset tagged with an immutable `batch_id`, operator identity, file SHA-256 hash, and original file name, establishing a tamper-evident audit lineage.

---

### 4. Functional Specifications & Engineering Standards

#### 4.1 Supported Streams & Target DuckDB Fact Schemas

| Stream Category | Identified Header Markers | Target DuckDB Fact Table | Critical Validation Constraints |
| :--- | :--- | :--- | :--- |
| **General Ledger Entries** | `date`, `account_code`, `debit`, `credit`, `memo` | `fact_general_ledger` | Must satisfy double-entry balance; valid dates; mandatory voucher ID |
| **SaaS/Revenue Movements** | `customer_id`, `mrr_amount`, `movement_type`, `date` | `fact_revenue_movements` | `movement_type` must match valid enums (New, Expansion, Contraction, Churn, Reactivation) |
| **Headcount & Payroll** | `employee_id`, `department_id`, `monthly_salary`, `start_date` | `fact_headcount_roster` | Salary must be > 0; department ID must resolve |
| **Operational Volume Drivers** | `metric_date`, `metric_key`, `numeric_value` | `fact_operational_metrics` | Metric keys must be registered in the semantic catalog |

#### 4.2 Streaming Ingestion & Memory Guardrails
- Backend file parsers use Go `excelize.OpenFile` with the `Rows()` iterator (Streaming Reader), prohibiting bulk in-memory loading.
- Memory constraint: Peak memory consumption during parsing of a 500,000-row file must not exceed 128 MB.

#### 4.3 Pre-flight Verification & Trial Balance Defense
Before writing to tenant DuckDB files, the following verification pipeline is strictly executed:
1. **Null & Type Verification**: Amount fields must be numeric; date strings must parse into valid ISO timestamps.
2. **Double-Entry Balance Verification**: For `fact_general_ledger`, the system verifies:
   $$\left| \sum \text{Debit} - \sum \text{Credit} \right| \le 0.0001$$
   If unbalance is detected, ingestion aborts immediately, returning exact difference figures and suspect row IDs.
3. **Idempotency Guard**: Matches file SHA-256 hash and workspace ID to block duplicate file ingestion.

#### 4.4 DuckDB Batch Append
- Employs the `go-duckdb` `Appender` API to stream validated rows directly into the tenant's isolated DuckDB database file.
- Logs successful ingestion batches in PostgreSQL metadata.

---

### 5. Acceptance Criteria & Test Cases

- [ ] **AC-01 (Standard CSV Ingestion)**: Upload a compliant 10,000-row GL CSV; parsing and database commit complete in under 2.0s, with row counts matching `SELECT COUNT(*)` in DuckDB.
- [ ] **AC-02 (Unbalanced Ledger Rejection)**: Upload a file intentionally manipulated with a $100 debit imbalance; the system rejects ingestion with HTTP 422, explicitly stating `Debit total $X does not balance Credit total $Y (Difference: $100.00)`.
- [ ] **AC-03 (Fuzzy Header Matching)**: Upload non-standard headers (`Posting Date`, `Acct Code`, `Amount Dr`); the auto-mapper resolves them to `posting_date`, `account_code`, `debit_amount` with $\ge 90\%$ accuracy.
- [ ] **AC-04 (Batch Audit Lineage)**: Querying the audit API returns the `batch_id`, operator ID, timestamp, row count, and total debits/credits for any completed batch.
