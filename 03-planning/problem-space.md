# 业财协同与沙盘推演问题空间 / Problem Space

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文定义

### 核心问题域划分

1. **数据集成与科目对齐 (Data Ingestion & COA Mapping)**：
   - 如何将不同 ERP/流水软件非标准的科目表（COA）低成本映射到标准 Fact 表。
2. **确定性指标计算与版本管理 (Semantic Metric & Multi-scenario Engine)**：
   - Actuals、Budget、Forecast 多版本的并发比对与快速聚合。
3. **因果驱动与实时推演 (Driver-based Simulation & Canvas)**：
   - 将经营因果逻辑以可视化图形呈现，并在用户调整驱动因子时毫秒级推导影响。
4. **自主归因与可解释报告 (Autonomous Attribution & Auditability)**：
   - 自动拆解方差，生成文字分析并支撑穿透到交易行。
5. **开放金融智能 (Financial MCP Extensibility)**：
   - 使外部大模型能够作为合规、可审计的财务分析师调取平台能力。

---

<a name="english"></a>
## English Definition

### Core Problem Domains

1. **Data Ingestion & COA Mapping**:
   - Ingesting non-standard Charts of Accounts (COA) from diverse ERP/billing tools into standard Fact schemas with minimal configuration overhead.
2. **Deterministic Metric Calculation & Multi-Scenario Engine**:
   - Concurrent comparison and sub-second aggregation across Actuals, Budget, and Forecast versions.
3. **Driver-Based Simulation & Live Canvas**:
   - Representing business causal logic in intuitive graphs and propagating driver adjustments across the P&L in sub-100ms.
4. **Autonomous Attribution & Auditability**:
   - Automatically decomposing variances into price/volume/mix drivers, generating narrative diagnosis, and supporting line-item transaction drill-downs.
5. **Open Financial Intelligence (Financial MCP Extensibility)**:
   - Exposing audited financial capabilities to external AI agents via standard MCP endpoints.

