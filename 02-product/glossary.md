# 核心业务与技术术语表 / Core Glossary

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
<a name="english"></a>
| 术语 / Term | 英文全称 / English Name | 统一业务定义 (中文) | Business Definition (English) |
| :--- | :--- | :--- | :--- |
| **FP&A** | Financial Planning & Analysis | 财务规划与分析：负责企业预算编制、预测模拟、管理报表出具与方差归因的核心财务职能。 | Core finance function responsible for budgeting, forecasting, management reporting, and variance attribution. |
| **Finance BP** | Finance Business Partner | 财务业务伙伴：深入业务前线（销售、产研、供应链），协助业务团队进行 ROI 分析、定价与资源配置的财务角色。 | Commercial finance role embedded in operating units (sales, R&D, supply chain) to guide ROI analysis, pricing, and resource allocation. |
| **Variance Analysis** | Variance Analysis | 方差/偏差分析：实际值（Actuals）与预算值（Budget）或预测值（Forecast）之间的差异对比与原因分解。 | Quantitative comparison and causal decomposition of differences between Actuals and Budget or Forecast. |
| **Waterfall** | Waterfall Chart / Bridge | 瀑布图/桥接分析：展示从起点指标到终点指标各驱动因子贡献增减的经典财务可视化图表。 | Financial visualization showing step-by-step positive and negative contributions of drivers from a baseline to an ending metric. |
| **Cash Runway** | Cash Runway | 现金跑道：当前可用现金储备与月均净消耗（Net Burn）的比值，表示不新增融资前提下企业可存活的月数。 | Ratio of available cash reserves to average monthly Net Burn, measuring surviving months without external financing. |
| **Net Burn** | Net Burn Rate | 月均净烧钱率：月度运营现金流出减去现金流入的差额。 | Monthly net cash outflow (operating cash disbursements minus cash receipts). |
| **GL / COA** | General Ledger / Chart of Accounts | 总账与会计科目表：记录企业所有借贷记账交易明细与层级科目的核心会计事实源。 | Canonical accounting source of truth recording double-entry transaction ledgers and hierarchical accounts. |
| **Driver-based Modeling**| Driver-based Modeling | 业务动因建模：基于业务活动量（如线索数、转化率、单价、客单成本）推导财务成果的动态预测模型。 | Dynamic forecasting methodology deriving financial outcomes from operational volume drivers (leads, conversion, price, unit costs). |
| **MCP** | Model Context Protocol | 模型上下文协议：连接大模型与外部系统工具、资源的标准开放协议。 | Open standard protocol connecting LLMs with external system tools, data resources, and prompt templates. |
| **DAG** | Directed Acyclic Graph | 有向无环图：用于表达业财指标因果驱动依赖链条的数据结构。 | Graph data structure representing causal driver dependencies between operational and financial metrics without circular loops. |
| **PVM** | Price-Volume-Mix Analysis | 量价组合方差分析：将收入偏差严格拆解为价格变动、销量变动与产品组合变动三种因果因子的经典分析模型。 | Variance decomposition model attributing revenue variances strictly into price, volume, and mix effects. |
| **SSSG** | Same-Store Sales Growth | 同店销售增长率：衡量去除新开门店影响后，成熟实体店/渠道内生增长质量的关键零售指标。 | Metric evaluating organic growth of mature retail stores/channels by excluding newly opened locations. |
| **Take Rate** | Take Rate | 货币化率/抽成率：平台型或电商交易中，平台佣金及增值服务收入占总成交总额（GMV）的百分比。 | Commission and value-added service revenue as a percentage of gross merchandise value (GMV) in platform/e-commerce models. |
| **CCM** | Continuous Control Monitoring | 持续控制监控：直连底层业务与财务流水，对 100% 全量交易实施常态化实时扫描的合规与风控机制。 | Automated compliance mechanism scanning 100% of underlying transactions continuously to detect anomalies. |
| **SoD** | Segregation of Duties | 职责分离：企业内部控制核心原则，确保不相容职务（如采购下单与付款审批）不能由同一人操作。 | Internal control principle ensuring incompatible duties (e.g., PO creation and payment approval) cannot be executed by the same person. |
| **Bento Grid** | Bento Grid | 便当盒网格布局：源于日式便当盒的非对称 12 列网格布局，依据指标商业优先级分配 Hero/Feature/Metric 空间权重。 | Asymmetric 12-column dashboard layout inspired by Japanese bento boxes, allocating spatial weight by business metric priority. |
| **Cmd+K** | Command Palette | 全局命令面板：支持键盘唤起的模糊搜索与操作执行器，允许在不打断工作流的前提下完成跨模块导航与即时变更。 | Keyboard-first launcher supporting fuzzy search and immediate action execution without interrupting current workflow. |


