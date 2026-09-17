# 关键决策日志 / Decision Log

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
<a name="english"></a>
| 决策 ID / Decision ID | 日期 / Date | 决策主题 / Topic | 最终结论 / Decision | 替代方案 / Alternatives | 决策依据与权衡 (中文 / EN) / Rationale & Trade-offs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-0001` | 2026-09-17 | 目标客群 / Target ICP | 兼顾 Mid-Market 与高成长 SMB / Target both Mid-Market & high-growth SMBs | 仅面向大集团 Enterprise 或纯 SMB / Pure Enterprise or pure micro-SMB | 兼顾开箱即用快速启动与中型企业支付能力 / Balances fast onboarding with high mid-market ACV willingness to pay. |
| `DEC-0002` | 2026-09-17 | 分析存储引擎 / Analytical Engine | 租户专属 DuckDB 加密文件 / Tenant-isolated encrypted DuckDB files | 纯共享数仓 / 纯 DuckDB-WASM / Shared data warehouse or pure WASM | 物理隔绝跨租户 SQL 数据泄露风险，极速列式聚合 / Physically eliminates cross-tenant SQL data leakage; sub-second vectorized aggregation. |
| `DEC-0003` | 2026-09-17 | 后端架构 / Backend Architecture | Go 核心 + Python 算法 Sidecar / Go Core + Python Algorithm Sidecar | 纯 Python 全栈 / 纯 TS 全栈 / Pure Python or pure TypeScript stack | Go 提供顶级并发、低资源与部署稳定性；Python 提供统计扩展 / Go provides concurrency and low resource usage; Python adds statistical modeling. |
| `DEC-0004` | 2026-09-17 | 财务防幻觉 / Zero-Hallucination | 声明式语义层 + 确定性 SQL + 数字穿透 / Declarative semantic layer + deterministic SQL + audit drill-down | 大模型心算 / 纯硬编码模版 / Direct LLM math or hardcoded templates | 100% 数学确定性与可信审计证据链 / Enforces 100% mathematical determinism and CFO auditability. |
| `DEC-0005` | 2026-09-17 | 沙盘推演交互 / Simulation UX | React Flow 因果 DAG 画布 + 滑块 / React Flow causal DAG canvas + sliders | 纯静态表格 / 独立沙盘草稿纸 / Static spreadsheets or disconnected scratchpads | 直观呈现因果驱动链，并与真实历史数据实时绑定 / Visualizes causal driver trees bound live to underlying historical actuals. |
| `DEC-0006` | 2026-09-17 | MCP 开放形态 / MCP Protocol Mode | 双模 MCP（Remote SSE/HTTP + Local Stdio） / Dual-mode MCP (Remote SSE/HTTP + Local Stdio) | 纯闭环云端 Webhook / Cloud-only webhooks | 既支持企业级远程 Agent，又支持本地桌面客户端直连 / Supports enterprise remote agents and analyst local desktop workflows (Claude Desktop/Cursor). |
| `DEC-0007` | 2026-09-17 | 模型网关选型 / Model Gateway | 支持 OpenAI/Anthropic-compatible API、Response API 与自托管模型 / OpenAI/Anthropic-compatible APIs, Response API & self-hosted models | 绑定单一商业供应商 / Single vendor lock-in | 保持模型中立与协议抽象，支持企业私有化部署 / Model neutrality, protocol abstraction, zero vendor lock-in, private deployment support. |


