# REQ-0004: 自主 Finance BP 方差分析 Memo 与数字穿透审计 / Autonomous Variance Memo & Audit Drill-down PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0004`
- **需求名称**：自主 Finance BP 方差分析 Memo 与数字穿透审计
- **关联来源**：`SRC-0001`（访谈轮次 5、8、10）、`SRC-0010`（模型中立网关架构）、`SRC-0014`（DuckDB 确定性明细穿透）
- **所属模块**：AI 智能 (AI Financial BP)
- **目标版本**：`v0.1`
- **生命周期状态**：`defined`（以 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md) 为准）
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供的 PVM 方差拆解与底层事实表数据）
- **责任人**：AI / Fullstack

---

### 2. 业务背景与用户痛点
在财务分析与经营汇报场景中：
1. **方差分析机械繁重**：每月 Actual vs Budget 差异分析中，分析师需要耗费大量时间手工做量价利（PVM: Price-Volume-Mix）拆解，并编写长篇管理分析备忘录（Financial Memo）。
2. **AI 生成财务报告的信任危机**：传统大模型生成的经营分析往往“文采飞扬但数字漂移”，模型经常在正文中编造未经核实的百分比或因果归因，CFO 与审计师绝不敢直接采纳。
3. **数字不可穿透回溯**：报告中的关键结论（如“云资源支出环比异常激增 \$42,000”）往往无法直接点击反查原始记账凭证，排查原因需在多个 ERP 与数仓系统之间来回倒腾。

**目标**：构建“算文分离”的自主 Finance BP 智能体。由 Go 后端通过 DuckDB 确定性执行 PVM 数学方差分解与指标计算，将经过校验的结构化数据输入模型中立网关生成专业述评。正文中的所有数字均封装为可交互穿透 Token，支持一键调出 SQL 与原始记账凭证。

---

### 3. 用户故事 (User Stories)
- **US-01 (CFO / 经营高管)**：作为 CFO，我希望在月结后一键生成包含量价拆解的经营分析 Memo，不仅有清晰的业务归因文字，还能确保报告中出现的每一个金额、百分比都有据可查，无大模型幻觉。
- **US-02 (财务分析师)**：作为财务分析师，在审阅 AI 生成的 Memo 时，我希望能点击正文中的任何数字，侧边抽屉立即展示背后的执行 SQL、计算公式以及底层账目明细（凭证号、供应商、发生日期），极大加速月结复核。
- **US-03 (系统与安全管理员)**：作为架构师，我希望模型接入层保持中立，系统能够无缝对接 OpenAI-compatible API、Anthropic-compatible API、Response API 或企业本地/私有云自托管模型（如 vLLM / Ollama），且敏感财务凭证明细在传输前必须完成数据脱敏。

---

### 4. 功能性需求与技术实现标准

#### 4.1 量价利方差数学分解 (PVM Decomposition)
系统在 Go 后端执行确定性代数分解，杜绝由大模型口算：
1. **销量差异 (Volume Variance)**：
   $$\Delta_{\text{volume}} = (Q_{\text{actual}} - Q_{\text{budget}}) \times P_{\text{budget}}$$
2. **价格差异 (Price Variance)**：
   $$\Delta_{\text{price}} = (P_{\text{actual}} - P_{\text{budget}}) \times Q_{\text{actual}}$$
3. **成本效率差异 (Cost Variance)**：
   $$\Delta_{\text{cost}} = (C_{\text{budget}} - C_{\text{actual}}) \times Q_{\text{actual}}$$
4. **总方差守恒校验**：
   $$\Delta_{\text{total}} \equiv \Delta_{\text{volume}} + \Delta_{\text{price}} + \Delta_{\text{cost}} + \text{Mix/Residual}$$
   若各分项之和与总利润变动额误差超出 $0.01$，系统自动告警并拒绝生成 Memo。

#### 4.2 模型中立网关设计 (Protocol-Neutral Model Gateway)
系统不与任何单一专有模型厂商硬编码绑定，提供协议中立的模型代理适配层：
- **兼容协议**：
  - OpenAI-compatible API (`/v1/chat/completions`)
  - Anthropic-compatible API (`/v1/messages`)
  - Response API（流式标准化事件协议）
  - 本地与私有云自托管模型（vLLM、Ollama、TGI）
- **算文分离执行流**：
  ```mermaid
  sequenceDiagram
    participant User as 财务分析师
    participant Backend as Go 核心后端
    participant DuckDB as DuckDB 嵌入式引擎
    participant Gateway as 模型中立网关
    participant LLM as 模型服务 (OpenAI/Anthropic/Local)

    User->>Backend: 请求生成 2026-Q1 方差 Memo
    Backend->>DuckDB: 执行指标计算与 PVM 分解 SQL
    DuckDB-->>Backend: 返回确定性事实数据集与 SQL 签名
    Backend->>Gateway: 组装结构化上下文 Prompt (纯事实 JSON)
    Gateway->>LLM: 调度模型生成专业分析述评 (禁止改动数字)
    LLM-->>Gateway: 返回带有 Token 标记的 Markdown
    Gateway-->>Backend: 验证数字签名一致性
    Backend-->>User: 渲染可穿透审计的交互式 Memo
  ```

#### 4.3 穿透审计组件与 Token 规范
AI 生成的 Markdown 文本中，数值均使用特定标记包裹，前端富文本解析器将其渲染为交互式组件：

```html
<MetricToken 
  metricId="gross_margin_variance" 
  value="-125000" 
  displayValue="-$125,000 (-4.2%)" 
  sqlHash="a7f8e32c"
  category="variance_pvm"
/>
```

- **点击穿透行为**：用户点击 `<MetricToken />`，系统滑出“审计溯源抽屉 (Audit Trace Drawer)”，包含：
  1. **计算公式与 PVM 拆解树**。
  2. **生成此数字的完整 DuckDB SQL 语句**（支持一键复制并在控制台复跑）。
  3. **底层明细表格**：列出贡献最大的前 20 条记账凭证明细（科目代码、部门、交易对手、金额）。

---

### 5. 验收标准 (Acceptance Criteria)
1. **零算术幻觉**：生成的 Memo 中所有财务金额和百分比必须 100% 来源于 Go 后端 DuckDB 计算上下文，数值与事实数据误差为 0。
2. **穿透覆盖率**：报告中关键指标与方差数值的 Token 化覆盖率达到 100%，点击后均能准确展示关联 SQL 与凭证切片。
3. **网关解耦性**：在配置文件中切换模型提供商（如从 OpenAI-compatible 切换为自托管 vLLM 端点）后，无需改动任何业务逻辑，Memo 生成与流式输出正常工作。
4. **生成时延**：完整分析报告（含数据预查、PVM 拆解与 1000 字分析生成）首字响应时间 $< 1.5\text{s}$，完整交付 $< 8\text{s}$。

---

<a name="english"></a>
## English Specification

### 1. Basic Metadata
- **Requirement ID**: `REQ-0004`
- **Requirement Name**: Autonomous Variance Memo & Audit Drill-down
- **Originating Sources**: `SRC-0001` (Interview rounds 5, 8, 10), `SRC-0010` (Protocol-neutral model gateway architecture), `SRC-0014` (DuckDB deterministic ledger drill-down)
- **Module**: AI Financial BP
- **Target Release**: `v0.1`
- **Lifecycle Status**: `defined` (governed in [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md))
- **Prerequisites**: `REQ-0002` (Depends on Semantic Metric Engine for PVM variance figures and fact ledger data)
- **Owner**: AI / Fullstack

---

### 2. Business Context & User Pain Points
In financial reporting and operational reviews:
1. **Tedious Manual Variance Commentary**: In monthly Actual vs Budget reviews, financial analysts spend days manually calculating Price-Volume-Mix (PVM) splits and writing exhaustive variance memos.
2. **Trust Deficit with AI-Generated Financial Reports**: Traditional LLM-generated reports produce polished prose plagued by arithmetic hallucinations, inventing unverified percentages and causal assertions that CFOs and auditors cannot accept.
3. **Opaque and Disconnected Transaction Lineage**: Key claims in executive summaries (e.g., "Cloud hosting expenditure spiked \$42,000 MoM") cannot be clicked to inspect underlying GL journal vouchers without cross-system spelunking across ERPs.

**Goal**: Establish a "Separation of Compute and Narrative" architecture. The Go backend computes deterministic PVM variance decompositions and aggregations via DuckDB. These validated figures are dispatched to a protocol-neutral gateway for professional narrative synthesis. All figures are wrapped in interactive tokens enabling one-click drill-down to the underlying SQL and journal vouchers.

---

### 3. User Stories
- **US-01 (CFO / Executive)**: As a CFO, I want a one-click generated monthly variance memo complete with PVM breakdowns and professional business attribution, with mathematical guarantee of zero arithmetic hallucinations.
- **US-02 (FP&A Analyst)**: As a financial analyst reviewing the AI memo, I want to click any number to instantly open an audit drawer displaying the underlying DuckDB SQL, mathematical formulas, and the contributing GL transactions (voucher ID, vendor, posting date).
- **US-03 (System & Security Admin)**: As an architect, I want the model gateway to remain vendor-agnostic, supporting OpenAI-compatible APIs, Anthropic-compatible APIs, Response APIs, or self-hosted models (vLLM / Ollama), with sensitive transaction scrubbing prior to external dispatch.

---

### 4. Functional Requirements & Technical Implementation Standards

#### 4.1 Price-Volume-Mix (PVM) Mathematical Decomposition
The Go backend performs deterministic algebraic decomposition:
1. **Volume Variance**:
   $$\Delta_{\text{volume}} = (Q_{\text{actual}} - Q_{\text{budget}}) \times P_{\text{budget}}$$
2. **Price Variance**:
   $$\Delta_{\text{price}} = (P_{\text{actual}} - P_{\text{budget}}) \times Q_{\text{actual}}$$
3. **Cost Efficiency Variance**:
   $$\Delta_{\text{cost}} = (C_{\text{budget}} - C_{\text{actual}}) \times Q_{\text{actual}}$$
4. **Conservation of Variance Guarantee**:
   $$\Delta_{\text{total}} \equiv \Delta_{\text{volume}} + \Delta_{\text{price}} + \Delta_{\text{cost}} + \text{Mix/Residual}$$
   If sum of components deviates from total variance by more than $0.01$, generation is halted with an integrity exception.

#### 4.2 Protocol-Neutral Model Gateway Architecture
The system avoids proprietary vendor lock-in, employing a protocol-neutral proxy layer:
- **Supported Protocols**:
  - OpenAI-compatible API (`/v1/chat/completions`)
  - Anthropic-compatible API (`/v1/messages`)
  - Response API (Standardized streaming event interface)
  - Local & private cloud self-hosted models (vLLM, Ollama, TGI)
- **Separation of Compute & Narrative Flow**:
  1. Go backend queries DuckDB for verified facts and computes PVM trees.
  2. Structured JSON payload with cryptographic hashes sent to Model Gateway.
  3. LLM synthesizes commentary and wraps numbers in `<MetricToken />` tags without altering values.
  4. Backend verifies returned tokens against factual hash tables before delivery.

#### 4.3 Audit Drill-down Component & Token Specification
In the rendered Markdown memo, all numeric references are tagged as interactive elements:

```html
<MetricToken 
  metricId="gross_margin_variance" 
  value="-125000" 
  displayValue="-$125,000 (-4.2%)" 
  sqlHash="a7f8e32c"
  category="variance_pvm"
/>
```

- **Interactive Drawer Interaction**: Clicking any `<MetricToken />` opens the "Audit Trace Drawer":
  1. **Mathematical formula and PVM decomposition breakdown**.
  2. **Exact DuckDB SQL query string** with one-click copy and console execution.
  3. **Underlying Transaction Ledger**: Top 20 contributing journal lines (Account, Cost Center, Vendor, Amount).

---

### 5. Acceptance Criteria
1. **Zero Arithmetic Hallucination**: 100% of numeric values in the generated memo correspond exactly to Go DuckDB query results with zero arithmetic drift.
2. **100% Drill-down Traceability**: All financial deltas and KPI metrics possess clickable tokens resolving to valid SQL statements and ledger entries.
3. **Model Neutrality**: Switching model providers in config (e.g. from OpenAI-compatible to self-hosted vLLM) requires zero code changes and produces equivalent streaming output.
4. **End-to-End Latency**: First-token streaming latency $< 1.5\text{s}$, with full 1,000-word executive memo completion $< 8\text{s}$.
