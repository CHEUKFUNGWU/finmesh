# 原始输入记录：FinMesh 首次产品与技术推演访谈 (/grill-me)

- **来源编号**：`SRC-0001`
- **日期**：2026-09-17
- **主题**：通用的 FP&A + Finance BP AI-Powered SaaS 平台决策树推演
- **参与方**：Founder / PM & Antigravity Agent

---

## 核心推演要点记录（原始结论）

1. **客群画像**：
   - 兼顾中型科技与成长期企业（Mid-Market / Scale-up，100-1000 人）以及高成长出海与初创企业（SMB，< 100 人）。
2. **交互范式**：
   - 混合 Web-Native 现代化多维工作台（Excel/Sheets 双向联动）+ 敏捷画布式体验（React Flow What-If 沙盘）+ AI Agent 决策备忘录驱动（带下钻穿透的 Variance Waterfall）。
3. **计算与数据网格**：
   - 现代分析型 SQL 引擎：租户专属 DuckDB 事实表与宽表存储。
4. **数据接入策略**：
   - 混合模式：主流财务/计费 API 直连（QBO, Xero, NetSuite, Stripe）+ 智能 Excel/CSV 解析，支持数仓原生模式（Snowflake/BigQuery/PostgreSQL），并对外提供 MCP / Plugins 开放能力。
5. **AI Agent 交付物**：
   - 1+2+3 组合：月结自动异动归因与 Executive Memo/PPT + 对话式 Text-to-SQL 即席分析 + 智能 What-If 沙盘推演。
6. **防幻觉与审计机制**：
   - 语义指标层 + 确定性 DuckDB SQL 校验 + 全流程数字穿透审计（点击数字穿透看 SQL 和明细流水）。
7. **技术选型**：
   - Go 核心系统（API、SaaS、DuckDB 调度、原生 MCP Server）+ 轻量 Python 算法 Sidecar（Prophet 时间序列预测、复杂 Monte-Carlo 模拟）+ Next.js 现代前端。
8. **多租户隔离**：
   - 租户专属 DuckDB 加密文件隔离 + 共享元数据 PostgreSQL。
9. **语义指标层**：
   - 标准开箱即用星型模型（`fact_gl`, `fact_revenue`, `fact_headcount`, `fact_drivers`）+ 声明式 YAML 指标 + dbt 风格定制化支持。
10. **MCP 开放架构**：
    - 双模 MCP 架构（Remote Cloud SSE/HTTP + Local Stdio 桥接）。
11. **模型网关**：
    - 模型中立网关（支持 Claude 3.7 / GPT-4o / DeepSeek R1 / 私有模型）。
12. **MVP 范围**：
    - 端到端垂直切片：智能 Excel/CSV 入库 -> Go+DuckDB 租户存储 -> 预置核心 SaaS/业财指标 -> Next.js（P&L 网格、React Flow 沙盘、穿透备忘录）-> Go 原生 MCP Server。
