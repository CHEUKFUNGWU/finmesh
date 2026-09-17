# 业财协同与沙盘推演问题空间 (Problem Space)

## 1. 核心问题域划分

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
