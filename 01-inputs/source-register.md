# 输入来源登记

| 来源 ID | 日期 | 材料 | 类型 | 提供方 | 项目内位置 / 外部链接 | 适用范围 | 当前处理状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-0001` | 2026-09-17 | FinMesh 首次产品与架构推演访谈 (/grill-me) | 讨论纪要 | Founder / PM | `01-inputs/2026-09-17-grill-me-interview.md` | 全局架构与产品定位 | 已分析，形成基线白皮书 |
| `SRC-0002` | 2026-09-17 | retail_performance_workstation | 代码与文档库 | CHEUKFUNGWU | [GitHub](https://github.com/CHEUKFUNGWU/retail_performance_workstation) | 财务BP/FP&A PRD、IFRS16准则、科目树(F1)、Agent Tool包装规范 | 已深度分析，已提取规范 |
| `SRC-0003` | 2026-09-17 | aegisplan | 代码与需求包 | CHEUKFUNGWU | [GitHub](https://github.com/CHEUKFUNGWU/aegisplan) | 财务与风控岗位SaaS需求、pgx/v5 与 nats 后端选型 | 已深度分析，已提炼模型 |
| `SRC-0004` | 2026-09-17 | go-admin | 开源框架 | go-admin-team | [GitHub](https://github.com/go-admin-team/go-admin) | Go RBAC 权限系统、Casbin 租户中间件与分层架构 | 已分析，待落地工程脚手架 |
| `SRC-0005` | 2026-09-17 | KamaCache-Go | 开源代码 | youngyangyang04 | [GitHub](https://github.com/youngyangyang04/KamaCache-Go) | Go 内存热点缓存、LRU 策略与并发安全保护 | 已分析，待落地指标缓存层 |
| `SRC-0006` | 2026-09-17 | modelcontextprotocol/go-sdk | 官方 SDK | Anthropic / MCP | [GitHub](https://github.com/modelcontextprotocol/go-sdk) | 官方 MCP 协议标准定义与数据传输结构 | 已分析，为 MCP 规范依据 |
| `SRC-0007` | 2026-09-17 | mcp-go | 开源框架 | mark3labs | [GitHub](https://github.com/mark3labs/mcp-go) | Go 原生 MCP Server 快速构建（Stdio / SSE） | 已分析，指定为核心开发框架 |
| `SRC-0008` | 2026-09-17 | nanoclaw | 开源框架 | nanocoai | [GitHub](https://github.com/nanocoai/nanoclaw) | 容器隔离 Agent 运行时、Agent Vault 凭证安全 | 已分析，指导安全凭据隔离 |
| `SRC-0009` | 2026-09-17 | pi | 开源工具 | earendil-works | [GitHub](https://github.com/earendil-works/pi) | 极简模块化 Agent 状态循环与 Diff 审查机制 | 已分析，指导 BP Agent 设计 |
| `SRC-0010` | 2026-09-17 | shadcn/ui | 官方设计库 | shadcn | [Website](https://ui.shadcn.com/) | 现代化 Web 组件库规范（Radix + Tailwind） | 已确立为前端基础 UI 规范 |
| `SRC-0011` | 2026-09-17 | Geist Design System | 设计语言 | Vercel | [Website](https://vercel.com/geist/introduction) | 专业高信息密度金融排版、等宽数字与无 Slop 规范 | 已确立为全局视觉风格规范 |
| `SRC-0012` | 2026-09-17 | Spectrum UI | 开源动效库 | Spectrum HQ | [Website](https://ui.spectrumhq.in/) | React Flow 沙盘连线、数值滚动与高阶交互微动效 | 已确立为沙盘交互参考 |

## 登记规则
- 原始材料不静默改写。
- 同一材料出现新版本时新增记录，保留旧版本。
- 正式需求必须引用来源 ID。
