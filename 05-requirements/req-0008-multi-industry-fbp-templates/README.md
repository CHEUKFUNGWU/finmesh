# REQ-0008: 多行业财务 BP 预置指标包与沙盘推演模板库 / Multi-Industry FBP Pre-built Metric Packs & Canvas Templates

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

### 1. 需求基本信息
- **需求 ID**：`REQ-0008`
- **状态 (唯一事实源)**：见 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **输入来源**：`SRC-0022` ([01-inputs/2026-09-27-cross-industry-finance-bp-research.md](../../01-inputs/2026-09-27-cross-industry-finance-bp-research.md))
- **所属版本**：`v0.2`
- **前置依赖**：`REQ-0002` (语义计算引擎), `REQ-0003` (驱动沙盘画布), `REQ-0009` (三栏指挥工作台)

### 2. 目标与范围
- 提供三大主流业财融合行业预置资产包：
  1. **企业级 SaaS (Enterprise SaaS)**：经常性收入 ARR 变动瀑布流（ARR Bridge）、净收入留存率（NRR）、获客回本周期（CAC Payback）、40% 原则（Rule of 40）、云基础设施 COGS。
  2. **电子商务与 DTC (E-Commerce / DTC)**：三层阶梯贡献毛利模型（CM1、CM2、CM3）、保本 ROAS 红线、退货率逆向物流成本与全渠道履约分摊。
  3. **连锁零售与快消 (Retail / Omnichannel FMCG)**：毛利瀑布流 GTN 贸易支出治理（票面折扣、表现返利、终端扫码促销）、单店模型（坪效、翻台率、客单价）。
- 绝不使用硬编码伪数据；所有行业模板自带严格借贷平衡（$\sum \text{Debit} = \sum \text{Credit}$）的标准科目表 (COA) 与真实分录凭证，并在 DuckDB 中注册原生语义指标与确定性 SQL 计算公式。
- 在前端 Pane 1 提供行业模板切换器，动态联动 Pane 2 的 KPI、P&L 表格、PVM/ARR/CM 瀑布图、敏感性沙盘驱动滑块及 Pane 3 行业专属归因 Memo。

### 3. 文档导航
- [产品需求文档 (PRD)](./prd.md)

---

<a name="english"></a>
## English Specification

### 1. Requirement Metadata
- **Requirement ID**: `REQ-0008`
- **Status (SSoT)**: Refer to [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **Source Input**: `SRC-0022` ([01-inputs/2026-09-27-cross-industry-finance-bp-research.md](../../01-inputs/2026-09-27-cross-industry-finance-bp-research.md))
- **Target Release**: `v0.2`
- **Dependencies**: `REQ-0002` (Semantic Metric Engine), `REQ-0003` (Driver Canvas), `REQ-0009` (3-Pane Command Workbench)

### 2. Objectives & Scope
- Pre-build domain-specific financial BP asset packages across three core verticals:
  1. **Enterprise SaaS**: ARR Bridge waterfall (New/Expansion/Contraction/Churn), NRR, CAC Payback, Rule of 40, Cloud Infrastructure Unit Economics.
  2. **E-Commerce & DTC**: Tiered Contribution Margin hierarchy (CM1, CM2, CM3), Breakeven ROAS threshold, Return reserve and reverse logistics costs.
  3. **Retail & FMCG**: Gross-to-Net (GTN) trade spend governance (off-invoice discounts, performance rebates, scan-backs), Store unit economics.
- Zero arbitrary hardcoded mock data: each industry preset contains authentic, double-entry trial-balanced general ledger journal entries and verified DuckDB SQL formulas.
- Deep integration into the 3-Pane Command Workbench with real-time industry switching.

### 3. Documentation
- [Product Requirement Document (PRD)](./prd.md)
