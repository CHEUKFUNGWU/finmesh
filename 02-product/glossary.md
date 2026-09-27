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
| **OTB** | Open-to-Buy | 采买预算：根据销售预测、期初实际库存、在途订单与期末目标库存动态计算的商品采买额度。 | Dynamic inventory procurement budget derived from sales forecast, planned ending inventory, beginning inventory, and on-order stock. |
| **GTN** | Gross-to-Net Waterfall | 毛利瀑布流：从标价毛销售额穿透至实际净销售额的核算架构，逐步扣减票面折让、达标返利、促销费用与商业索赔。 | Accounting hierarchy reconciling Gross Sales down to Net Sales by deducting off-invoice discounts, performance rebates, trade promotions, and customer deductions. |
| **Trade Spend** | Trade Spend / Trade Accruals | 贸易支出/贸易准备金：快消企业投放于渠道的促销与陈列费用总和，需动态计提准备金防范跨期核销冲击。 | Channel promotional and merchandising investments incurred by FMCG brands, requiring dynamic accrual tracking to prevent fiscal surprises. |
| **Promotional ROI** | Promotional Return on Investment | 促销投资回报率：剥离自然基线销量与品类内部蚕食效应后，增量毛利与贸易实际投入的比值。 | Net financial return of trade promotions calculated as incremental margin divided by trade spend after stripping baseline volume and cannibalization. |
| **GMROI** | Gross Margin Return on Investment | 销货毛利投资回报率：衡量库存资产运用效率的核心指标，等于毛利率乘以存货周转率（毛利总额 / 平均存货占用成本）。 | Inventory productivity metric defined as gross margin dollars divided by average inventory cost (Gross Margin % × Inventory Turnover). |
| **CM1 / CM2 / CM3** | Multi-tier Contribution Margins | 阶梯贡献毛利模型：电商按单拆解收益的层级毛利：CM1（扣商品采购与头程）、CM2（扣仓储履约/末端运费/支付手续费）、CM3（扣效果营销与买量）。 | Multi-tiered e-commerce contribution margin model: CM1 (net sales minus COGS & inbound freight), CM2 (minus fulfillment, last-mile & payment fees), and CM3 (minus performance marketing & customer acquisition). |
| **Breakeven ROAS** | Breakeven Return on Ad Spend | 保本广告投资回报率：确保边际不亏损的最低广告产出比，数值等于 1 除以 CM2 利润率。 | Minimum advertising return ratio threshold required to avoid marginal cash burn, calculated as 1 / (CM2 Margin %). |
| **ARR Bridge** | ARR Waterfall / Bridge | 经常性收入变动瀑布流：期末 ARR 相比期初 ARR 的拆解模型，细分为新客（New-Logo）、增购（Expansion）、缩单（Contraction）与流失（Churn）。 | Waterfall decomposition reconciling ending ARR from beginning ARR via New-Logo, Expansion, Contraction, and Churn components. |
| **NRR / GRR** | Net / Gross Retention Rate | 净收入留存率与毛收入留存率：NRR 衡量存量客户包含增购与流失后的净扩张（健康值 110-130%）；GRR 剔除增购仅衡量基盘抗侵蚀能力（健康值 ≥ 85%）。 | Key SaaS retention metrics: NRR evaluates cohort net expansion including expansion and churn; GRR isolates revenue erosion excluding upsells. |
| **CAC Payback** | Customer Acquisition Cost Payback Period | 获客成本回本周期：用订阅毛利覆盖销售与营销费用所需月数，通常要求控制在 12 个月以内。 | Number of months required for subscription gross profit to recover upfront sales and marketing acquisition expenditure. |
| **Rule of 40** | Rule of 40 | 40% 原则：衡量 SaaS 企业成长性与盈利性平衡的黄金法则，即 ARR 年化增长率与自由现金流利润率（FCF Margin）之和大于等于 40%。 | High-level SaaS health benchmark stating that the sum of annual ARR growth rate and free cash flow (FCF) margin should equal or exceed 40%. |
| **Burn Multiple** | Burn Multiple | 资本消耗乘数：净现金流出额与净新增 ARR 的比值，衡量每创造 1 美元经常性收入所消耗的现金资本效率。 | Capital efficiency metric defined as net cash burned divided by net new ARR added over a given period. |
| **Cloud Unit Economics** | Cloud Unit Economics | 云单位经济学：核算单租户或单 API 调用底层计算与存储资源的边际成本，指导毛利率优化。 | Cost allocation discipline measuring cloud compute/storage consumption per tenant or per API call to optimize SaaS gross margins. |
| **CTS** | Cost-to-Serve | 综合服务成本模型：基于作业成本法（ABC），将订单处理、仓储分拣、干线运输、末端配送与逆向退货全链路成本映射至具体客户与交易。 | Activity-Based Costing (ABC) framework mapping end-to-end operational costs (order entry, pick/pack, warehousing, haulage, delivery, returns) to specific accounts. |
| **Whale Curve** | Customer Profitability Whale Curve | 客户盈利能力鲸鱼曲线：按客户贡献累计净利润降序排列呈现的曲线，揭示前 20% 高效客户贡献超额利润与后 20% 亏损长尾侵蚀利润的现象。 | Cumulative profit distribution curve ranking accounts by profitability, illustrating that the top 20% of customers typically generate 150-200% of net profits while the bottom 20% destroy value. |
| **S&OP** | Sales and Operations Planning | 产销协同计划：跨销售、供应链与财务的高阶月度决策机制，旨在形成供需与财务同频的单一数字预测（One Number Forecast）。 | Cross-functional governance process aligning demand forecasts, supply constraints, and financial targets into a reconciled "One Number Forecast". |
| **STR** | Sell-Through Rate | 售罄率：特定时间周期内实际销售件数占期初库存总件数的百分比，决定降价阶梯（Markdown Ladder）的触发节点。 | Percentage of units sold over a given period relative to initial delivered inventory, driving markdown ladder timing in fashion retail. |
| **UPH** | Units Per Hour | 每工时分拣/处理件数：仓储与物流履约现场衡量人工人效的核心指标。 | Operational warehouse productivity metric measuring physical items picked or processed per labor hour. |


