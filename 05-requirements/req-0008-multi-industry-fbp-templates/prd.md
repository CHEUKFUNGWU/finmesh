# REQ-0008: 多行业财务 BP 预置指标包与沙盘推演模板库 PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文说明

### 1. 需求元数据
- **需求编号**：`REQ-0008`
- **需求名称**：多行业财务 BP 预置指标包与沙盘推演模板库 (Multi-Industry FBP Pre-built Metric Packs & Canvas Templates)
- **状态 (唯一事实源)**：见 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md)
- **来源引用**：`SRC-0022` ([01-inputs/2026-09-27-cross-industry-finance-bp-research.md](../../01-inputs/2026-09-27-cross-industry-finance-bp-research.md))
- **所属版本**：`v0.2`
- **优先级**：P1
- **负责人**：PM / Fullstack

### 2. 背景与核心价值
- `[已观察]` 财务业务伙伴（Finance Business Partner, FBP）在不同行业的日常工作核心完全建立在行业特定的驱动逻辑之上（`SRC-0022`）：
  - **SaaS**：现金流与收入确认错配，围绕 ARR Bridge 瀑布流、NRR 客户留存与获客回本周期（CAC Payback）展开；
  - **电商 & DTC**：碎片化履约与流量成本波动，必须使用 CM1、CM2、CM3 阶梯贡献毛利模型，以保本 ROAS 红线指导投放；
  - **连锁零售与快消**：贸易支出（Trade Spend）占销售额 15%~30%，依赖 GTN（Gross-to-Net）毛利瀑布与单店模型监控坪效。
- `[推断]` 若 FinMesh 仅提供单一通用利润表模型，将无法体现业财融合的核心深度与专业壁垒。预置多行业开箱即用指标包与因果沙盘，将显著降低垂直行业落地门槛。
- `[硬性约束]` 绝不使用随手捏造的伪数据；每个行业预置包自带严格借贷试算平衡（$\left|\sum \text{Debit} - \sum \text{Credit}\right| \le 0.001$）的标准科目表 (COA) 与真实分录凭证，并在 DuckDB 中注册确定性语义指标公式。

---

### 3. 功能架构与行业模板规范

```
                               ┌────────────────────────────────────────────────────────┐
                               │            Pane 1: Industry Preset Selector            │
                               │  [SaaS (B2B)]  [E-Commerce / DTC]  [Retail / FMCG]    │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
    ┌──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┐
    │                                              Pane 2: Workbench Canvas                                       │
    │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐ │
    │  │       Top 4 KPIs        │  │     P&L / CM Table      │  │  PVM / ARR / CM Bridge  │  │ Dynamic Sandbox │ │
    │  │ (ARR, NRR, CAC, R40...) │  │ (Reconciled to GL)      │  │ (Dynamic Conservation)  │  │ (Industry Driver)│ │
    │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  └─────────────────┘ │
    └──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │           Pane 3: Industry AI Variance Memo            │
                               │   Domain Insights & Line-Item Drill-Down Tokens        │
                               └────────────────────────────────────────────────────────┘
```

#### 3.1 行业包定义

##### 行业 1：企业级 SaaS (Enterprise SaaS)
1. **核心 KPI**:
   - `ARR (年度经常性收入)`: $2,400,000 (Budget: $2,600,000, $\Delta$: -$200,000)
   - `NRR (净收入留存率)`: 114.2% (Budget: 118.0%, $\Delta$: -3.8%)
   - `CAC Payback`: 14.2 个月 (Budget: 12.0 个月, $\Delta$: +2.2 个月)
   - `Rule of 40 得分`: 42.5% (ARR 增速 32.5% + FCF 利润率 10.0%)
2. **P&L / 损益表结构**:
   - 订阅 ARR 收入 (`Account 4001`)
   - 实施交付服务收入 (`Account 4002`)
   - 云计算基础设施 COGS (AWS/GCP, `Account 5001`)
   - 实施交付人员成本 (`Account 5002`)
   - 毛利润 (Gross Profit)
   - 销售与市场拓展支出 S&M (`Account 6001`)
   - 研发人员薪酬与云开发环境 R&D (`Account 6002`)
   - 管理费用 G&A (`Account 6003`)
3. **ARR Bridge 变动瀑布**:
   - 期初 ARR &rarr; 新客签单 (+$450k) &rarr; 老客增购 (+$220k) &rarr; 降级缩单 (-$80k) &rarr; 流失退订 (-$190k) &rarr; 期末 ARR ($2.40M)。
4. **敏感性驱动因子**:
   - AE 人数与人均配额 (Quota)
   - 营销获客成本投放 (S&M Spend)
   - 云计算单租户边际成本 (Cloud Unit Economics)

##### 行业 2：电子商务与 DTC (E-Commerce / DTC)
1. **核心 KPI**:
   - `GMV (商品交易总额)`: $3,800,000 (Budget: $4,200,000)
   - `Net Sales (扣退实销)`: $3,040,000 (退货率 20.0%)
   - `CM3 (扣营销贡献毛利)`: $638,400 (CM3 利润率 21.0%)
   - `Blended ROAS`: 3.8x (保本 ROAS 红线: 3.1x)
2. **P&L / 阶梯贡献毛利 (CM1-CM3) 结构**:
   - 净销售额 Net Sales (`GMV - 退款/退货折让`)
   - CM1: `Net Sales - 商品采购成本 (COGS) - 头程物流`
   - CM2: `CM1 - 仓储波次分拣包材 - 快递配送费 - 支付手续费 - 逆向退货物流`
   - CM3: `CM2 - 效果广告投放支出 (Performance Ad Spend) - 带货主播分成`
   - 固定费用: 研发、IT系统与总部管理 OpEx
   - 经营利润 (Operating Profit)
3. **CM 变动瀑布流**:
   - GMV &rarr; 退款退货 (-$760k) &rarr; 采购头程成本 (-$1,216k) &rarr; 履约配送包材 (-$380k) &rarr; 营销广告投放 (-$500k) &rarr; 沉淀 CM3 利润 ($638.4k)。
4. **敏感性驱动因子**:
   - 广告投放 ROAS 乘数 ($\pm 20\%$)
   - 综合退货率 ($\pm 5\%$)
   - 单均履约物流包材成本 ($\pm \$1.5$)

##### 行业 3：全渠道零售与快消 (Retail & FMCG)
1. **核心 KPI**:
   - `Gross Sales (出厂毛销)`: $5,200,000 (Budget: $5,500,000)
   - `Net Sales (扣折让净销)`: $4,160,000 (GTN 漏斗扣减率 20.0%)
   - `Store Unit Margin (单店模型贡献)`: $890,000 (平均坪效 ¥4,850/㎡)
   - `Trade Promo ROI`: 18.5%
2. **P&L / GTN 损益表结构**:
   - 名义毛销售额 Gross Sales
   - 票面即时折扣 Off-Invoice Discounts (`Account 4101`)
   - 表现返利与渠道达标返点 Rebates (`Account 4102`)
   - 终端扫码返利与进场堆头费 Trade Promotions (`Account 4103`)
   - 净销售额 Net Sales
   - 生产标准制造成本与原料 COGS (`Account 5001`)
   - 毛利润 Gross Profit
   - 门店租金摊销与导购固定薪酬 Store Fixed OpEx (`Account 6001`)
   - 经营利润 Operating Profit
3. **GTN & PVM 瀑布流**:
   - 标价出货 &rarr; 票面折扣 (-$420k) &rarr; 达标返点 (-$310k) &rarr; 促销堆头费 (-$310k) &rarr; 净销售额 ($4.16M) &rarr; COGS (-$2.08M) &rarr; 营业利润。
4. **敏感性驱动因子**:
   - 贸易投资率 Trade Spend % ($\pm 3\%$)
   - 原料大宗物耗方差 BOM Variance ($\pm 5\%$)
   - 单店人效与坪效乘数

---

### 4. 接口契约与后端交互 (Backend API)

1. `GET /api/v1/industry/packs`
   - 返回已支持的行业预置包清单（`id`, `name`, `description`, `icon`, `kpis`）。
2. `POST /api/v1/industry/switch?industry={id}`
   - 触发 Go 后端 DuckDB 加载对应行业的标准科目表、初始化凭证，并在内存中进行试算平衡验证。
   - 响应格式：
     ```json
     {
       "status": "ok",
       "industry": "saas",
       "trial_balance": {
         "balanced": true,
         "total_debit": 2860000.00,
         "total_credit": 2860000.00,
         "discrepancy": 0.00
       },
       "metrics_count": 8,
       "entries_count": 24
     }
     ```
3. `GET /api/v1/industry/current`
   - 获取当前激活行业的指标基准数据与拓扑 DAG 节点。

---

### 5. 验收标准 (Acceptance Criteria)

- **AC-001 (借贷平衡硬约束)**：SaaS、E-commerce、Retail、General 4 套行业的全部演示凭证在 DuckDB 中必须满足 $\left|\sum \text{Debit} - \sum \text{Credit}\right| = 0.00$，杜绝单边入账。
- **AC-002 (行业平滑切换)**：在 Pane 1 点击任意行业，主工作台在 100ms 内平滑完成 KPI 卡片、P&L 报表、瀑布图和敏感性沙盘的联动刷新。
- **AC-003 (代数守恒保证)**：SaaS 的 ARR Bridge 与 E-commerce 的 CM 阶梯瀑布必须满足代数绝对守恒，动态守恒校验条显示绿色平衡状态。
- **AC-004 (数字穿透一致性)**：点击各行业 KPI 或 Memo 中的 Token，滑出的 Audit Drawer 必须展示该行业真实的 DuckDB 分录明细与 SQL，数值绝对吻合。
- **AC-005 (视觉设计规范)**：新增的行业切换器与专用卡片严格遵循 `#070A10` 纯正黑白灰中性规范与 3 级字重约束。
