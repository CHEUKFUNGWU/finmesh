# 业财协同与沙盘推演问题空间 / Problem Space

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文定义

### 核心问题域划分

1. **数据集成与科目对齐 (Data Ingestion & COA Mapping)**：
   - 如何将不同 ERP/流水软件非标准的科目表（COA）低成本映射到标准 Fact 表；支持对接 TPM、POS、Shopify、Stripe、TMS、WMS 等跨行业前端业务源。
2. **确定性指标计算与版本管理 (Semantic Metric & Multi-scenario Engine)**：
   - Actuals、Budget、Forecast 多版本的并发比对与快速聚合。
   - 跨行业深层利润模型穿透：支持快消 GTN 毛利瀑布流、电商 CM1-CM3 阶梯边际贡献、SaaS ARR 变动瀑布流（NRR/GRR）、物流作业成本（ABC）与综合服务成本（CTS）模型（依据 [SRC-0022](../01-inputs/2026-09-27-cross-industry-finance-bp-research.md)）。
3. **因果驱动与实时推演 (Driver-based Simulation & Canvas)**：
   - 将经营因果逻辑以可视化图形呈现，并在用户调整驱动因子时毫秒级推导影响。
   - 垂直行业因果沙盘拓扑：预置鞋服 OTB 采买平衡与打折阶梯沙盘、电商保本 ROAS 与获客投放沙盘、SaaS 销售产能与 CAC 回本沙盘、物流拼载率与仓储负荷拐点沙盘。
4. **自主归因与可解释报告 (Autonomous Attribution & Auditability)**：
   - 自动拆解方差（PVM、BOM 用量与配比差异），生成文字分析并支撑穿透到交易行。
   - 多频次经营分析节律适配：支持生成每日异动早报（Daily Flash）、每周交易/管线复盘（Weekly Trading/Pipeline）、月度产销协同（S&OP / One Number Forecast）与月度经营分析（MBR）备忘录。
5. **开放金融智能 (Financial MCP Extensibility)**：
   - 使外部大模型能够作为合规、可审计的财务分析师调取平台能力。

---

<a name="english"></a>
## English Definition

### Core Problem Domains

1. **Data Ingestion & COA Mapping**:
   - Ingesting non-standard Charts of Accounts (COA) from diverse ERP/billing tools into standard Fact schemas with minimal configuration overhead; ingesting industry-specific feeds (TPM, POS, Shopify, Stripe, TMS, WMS).
2. **Deterministic Metric Calculation & Multi-Scenario Engine**:
   - Concurrent comparison and sub-second aggregation across Actuals, Budget, and Forecast versions.
   - Deep multi-industry profit modeling: FMCG Gross-to-Net (GTN) waterfall, E-commerce CM1-CM3 contribution margin ladder, SaaS ARR bridge (NRR/GRR), and logistics Activity-Based Costing (ABC) / Cost-to-Serve (CTS) models (citing [SRC-0022](../01-inputs/2026-09-27-cross-industry-finance-bp-research.md)).
3. **Driver-Based Simulation & Live Canvas**:
   - Representing business causal logic in intuitive graphs and propagating driver adjustments across the P&L in sub-100ms.
   - Pre-built vertical causal topologies: Fashion dynamic OTB & markdown ladders, E-commerce breakeven ROAS & acquisition sandboxes, SaaS sales capacity & CAC payback models, and logistics load factor / warehouse capacity inflection sandboxes.
4. **Autonomous Attribution & Auditability**:
   - Automatically decomposing variances (PVM, BOM usage/mix), generating narrative diagnosis, and supporting line-item transaction drill-downs.
   - Multi-cadence operational governance: Generating Daily Flash Reports, Weekly Trading/Pipeline reviews, monthly S&OP (One Number Forecast), and MBR memos.
5. **Open Financial Intelligence (Financial MCP Extensibility)**:
   - Exposing audited financial capabilities to external AI agents via standard MCP endpoints.

