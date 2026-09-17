# 开源技术选型、商业许可证合规矩阵与推荐清单

- **来源编号**：`SRC-0020`
- **登记日期**：2026-09-17
- **主题**：FinMesh 开源技术栈审查、商业 SaaS 许可证边界与扩展清单

---

## 1. 核心技术栈全景与合规审查

| 技术分层 | 开源项目 | 许可证 | 商业使用边界与约束 | FinMesh 采纳策略与定位 |
| :--- | :--- | :--- | :--- | :--- |
| **后端基础设施** | Temporal | MIT | 宽松商用：核心服务与 SDK 均可自由商用与闭源集成。 | 处理跨系统重试与长周期审批工作流。 |
| | NATS JetStream | Apache 2.0 | 宽松商用：包含明确的专利授权条款。 | 承载低延迟事件流与变更广播。 |
| | TimescaleDB | Apache 2.0 / TSL | 双协议：基础功能为 Apache 2.0；压缩与连续聚合受 TSL 保护。允许作为 SaaS 内部库，禁止直接对外提供 DBaaS 托管。 | 时序金融指标备选底层。 |
| | ClickHouse | Apache 2.0 | 宽松商用：支持大规模列式查询。 | 大规模明细日志与全量交易扫描备选。 |
| | Casbin | Apache 2.0 | 宽松商用：支持以内嵌库形式集成。 | 租户内细粒度 RBAC 权限控制引擎。 |
| | Ory Kratos | Apache 2.0 | 宽松商用：支持自托管与商用改造。 | 企业级身份认证与 SSO 接入。 |
| | Apache APISIX | Apache 2.0 | 宽松商用：Apache 顶级基金会治理，合规风险低。 | 外部 API 网关与速率限制。 |
| **AI / 多智能体** | LangGraph | MIT | 宽松商用：支持自由编排与封装。 | 复杂多步 Agent 状态机编排。 |
| | OpenBB Platform | AGPLv3 | **存在网络传染风险 (Network Copyleft)**：修改源码并通过网络提供服务有开源诉求。 | **容器隔离**：作为独立微服务运行，仅通过 REST API 交互，不直接 import 其源码。 |
| | FinGPT | MIT | 代码本身为 MIT，但需注意微调基座模型自身的商业使用量上限限制。 | 用于金融分析微调实验。 |
| | NeMo Guardrails | Apache 2.0 | 宽松商用：NVIDIA 官方开源。 | 财务对话与 SQL 生成的安全防御栏。 |
| | LiteLLM | MIT | 宽松商用：网关核心代码为 MIT（部分管理面板需企业授权）。 | 多模型适配代理网关（统一接入 OpenAI-compatible、Anthropic-compatible 与自托管模型）。 |
| | Qdrant | Apache 2.0 | 宽松商用：支持自建向量集群。 | 财务文档非结构化 RAG 向量检索。 |
| **前端组件** | shadcn/ui | MIT | 宽松商用：组件直接以源码形式放入项目，无外部运行时依赖。 | 前端基础 UI 规范。 |
| | Tremor | Apache 2.0 | 宽松商用：可自由定制与调整样式。 | 仪表盘 KPI 卡片与微型图表。 |
| | Lightweight Charts | Apache 2.0* | **带强制署名约束**：商用免费但必须在图表页面保留 TradingView Logo 与链接。 | **合规替代**：采用 Apache ECharts，避免商业产品出现第三方强制水印。 |
| | TanStack Table | MIT | 宽松商用：无头 UI 逻辑库，不包含预设样式。 | 数据表格状态与分页排序管理。 |

---

## 2. FinMesh 架构增补推荐

针对 FinMesh 的 **Go 核心 + DuckDB 租户隔离 + Next.js 画布 + MCP 服务** 架构，推荐增补以下开源项目：

| 技术分层 | 推荐开源项目 | 许可证 | 许可证特性与采纳理由 | 在 FinMesh 中的具体职责 |
| :--- | :--- | :--- | :--- | :--- |
| **数据与计算** | DuckDB | MIT | 宽松商用：单进程嵌入式列式计算，支持多租户独立数据库文件隔离。 | **核心计算引擎**：承载 `fact_gl`、PVM 量价分解、PIVOT/UNPIVOT 报表透视与秒级聚合。 |
| | Apache Arrow (Go) | Apache 2.0 | 宽松商用：跨语言零拷贝列式内存标准。 | Go 核心后端与 Python 算法 Sidecar 间的高速内存交换管道。 |
| | pgx / pgxpool | MIT | 宽松商用：Go 语言原生 PostgreSQL 驱动与连接池。 | 承载用户鉴权、租户元数据、声明式指标定义与审计日志读写。 |
| | Valkey | BSD-3-Clause | 宽松商用：Linux 基金会主导的开源项目，无 Redis 双协议合规争议。 | 承载 In-Memory 指标缓存、推演状态暂存与分布式锁。 |
| **调度与事件** | Asynq | MIT | 宽松商用：基于 Redis 的 Go 原生分布式任务队列，部署结构简单。 | 负责月结任务调度、大文件批量解析、后台报告生成与消息通知。 |
| | Watermill | MIT | 宽松商用：Go 原生事件驱动与消息流编排框架。 | 驱动财务分录变更事件、审计操作追踪与 RCM 矩阵规则触发。 |
| **MCP 与 Agent** | mcp-go (mark3labs) | MIT | 宽松商用：Go 社区的 Model Context Protocol 实现，支持 Stdio/SSE 通道。 | **核心开放协议栈**：构建 FinMesh 原生 Financial MCP Server。 |
| | E2B Code Interpreter | Apache 2.0 | 宽松商用：提供隔离容器沙箱，用于运行生成的 Python 代码。 | 运行大模型生成的临时 Python 计算脚本，隔离宿主机环境。 |
| **前端视觉画布** | @xyflow/react (React Flow) | MIT | 宽松商用：节点流程与有向无环图（DAG）实现库。 | **因果沙盘画布**：渲染 ARR、CAC、Runway 因果驱动树，集成动态推演滑块。 |
| | Apache ECharts | Apache 2.0 | 宽松商用：**无强制署名要求**，支持多系列组合图表。 | **标准金融图表库**：渲染 PVM 量价归因瀑布图、现金跑道收敛曲线与经营看板。 |
| | AG Grid Community | MIT | 宽松商用：支持大数据量虚拟滚动、列冻结与行内编辑。 | **多维 P&L 矩阵网格**：提供类 Excel 的操作体验与等宽数字对齐。 |
| | cmdk | MIT | 宽松商用：全局命令面板无头组件。 | **Cmd+K 命令面板**：实现纯键盘驱动的跨情景切换、全局搜索与操作执行。 |

---

## 3. 商业许可证风险边界与防御准则 (Guardrails)

### 3.1 AGPLv3 传染风险防御（以 OpenBB 为例）
- **风险描述**：AGPLv3 具备网络传染性。若在 FinMesh 核心 Go 后端中静态链接或直接引用源码，整个商业系统可能存在被迫开源源码的风险。
- **隔离方案**：
  - 将 OpenBB 封装在独立的容器镜像中作为外部数据微服务运行。
  - 主系统仅通过标准 HTTP/gRPC 网关调用其数据接口，通过网络边界阻断 AGPLv3 协议的传染要求。

### 3.2 商业品牌洁净度（以 TradingView 为例）
- **风险描述**：TradingView Lightweight Charts 附带强制署名要求，必须在图表界面保留 TradingView 水印或链接。
- **替代方案**：
  - 选用 Apache ECharts（纯正 Apache 2.0，无任何归属权水印要求）负责核心财务 Waterfall 与多维趋势呈现。
  - 选用 AG Grid Community（MIT 协议）负责高密度网格，保持产品界面的品牌独立性。

### 3.3 缓存组件协议变动防御（以 Redis 为例）
- **风险描述**：Redis 官方已转向 RSALv2 / SSPLv1 双源可用协议，非完全开源许可。
- **避险方案**：选用 Linux 基金会主导的 Valkey（BSD-3-Clause），保持开源属性与协议兼容。
