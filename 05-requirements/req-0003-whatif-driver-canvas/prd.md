# REQ-0003: React Flow 驱动因果沙盘画布与 What-If 模拟 / React Flow Causal Driver Canvas & What-If Simulation PRD

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规范

### 1. 需求基本信息
- **需求 ID**：`REQ-0003`
- **需求名称**：React Flow 驱动因果沙盘画布与 What-If 模拟
- **关联来源**：`SRC-0001`（访谈轮次 4、7、10）、`SRC-0012`（React Flow / @xyflow/react）、`SRC-0014`（DuckDB 毫秒级内存重算）
- **所属模块**：画布推演 (Canvas & Simulation)
- **目标版本**：`v0.1`
- **生命周期状态**：`defined`（以 [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md) 为准）
- **前置依赖**：`REQ-0002`（依赖语义指标引擎提供的基准值与公式元数据）
- **责任人**：Frontend / Fullstack

---

### 2. 业务背景与用户痛点
在传统财务建模与经营决策中：
1. **黑盒 Excel 公式链条**：复杂的财务模型散落在成百上千个单元格中，跨表引用如同迷宫，管理层无法直观理解底层业务动因（如客户流失率、获客单价、销售人效）如何层层传导至最终净利润与现金流。
2. **场景推演迟钝且易错**：每当管理层询问“如果下季度提价 10%，同时客户流失率增加 2 个百分点，现金跑道会缩短还是延长？”，财务分析师往往需要花费数小时甚至数天手动调整 Excel 副本，且极易破坏勾稽关系。
3. **推演结论缺乏因果透明度**：大模型生成的情景预测往往直接输出数字，无法可视化展示“哪项假设起了主导作用”，决策者不敢采纳。

**目标**：基于 React Flow 构建可视化因果驱动树画布。将财务指标抽象为可交互的节点网络，支持滑块微调、敏感度实时传导、基准与模拟场景分屏对比，并在毫秒级内完成 DAG 级联重算。

---

### 3. 用户故事 (User Stories)
- **US-01 (CFO / 管理层)**：作为 CFO，我希望在画布上直观查看“收入 = 付费客户数 × 客单价 (ARPU)”与“毛利 = 收入 - 销货成本 (COGS)”的上下游传导路径，清晰洞察业务杠杆点。
- **US-02 (财务分析师)**：作为财务分析师，我希望通过拖动滑块调整关键驱动因子（例如：营销预算 $\pm 20\%$、销售转化率 $+1.5\%$），画布在 100ms 内实时重算并高亮显示全链路指标的绝对变化额与百分比变动。
- **US-03 (业务单元负责人)**：作为业务线主管，我希望将满意的模拟参数保存为独立场景（如“保守控费版”与“激进扩张版”），并一键导出情景瀑布图与对比报表，供管理委员会决策评审。

---

### 4. 功能性需求与技术实现标准

#### 4.1 画布节点与连接模型 (Graph Schema)
沙盘画布基于 `@xyflow/react` 构建，包含三类核心节点与有向依赖边：

```typescript
export type DriverNodeType = 'metric' | 'driver' | 'formula';

export interface DriverNodeData {
  id: string;
  name: string;
  displayName: string;
  category: 'Revenue' | 'Expense' | 'Headcount' | 'KPI';
  nodeType: DriverNodeType;
  // 基准值（来自 REQ-0002 语义引擎事实数据）
  baselineValue: number;
  // 模拟调整后的当前值
  simulatedValue: number;
  // 调整模式与幅度
  adjustmentType: 'percentage' | 'absolute' | 'fixed';
  adjustmentDelta: number; // 例如 +0.10 代表 +10%
  // 计算公式（针对 formula 与 metric 节点）
  formula?: string; // 例如: "active_customers * arpu"
  unit: 'currency' | 'percent' | 'count';
  historicalTrend?: number[]; // 最近 6 个月历史火花线数据
}

export interface DriverEdgeData {
  id: string;
  source: string; // 上游驱动节点 ID
  target: string; // 下游指标节点 ID
  weight?: number; // 敏感度传导系数
  relationship: 'positive' | 'negative'; // 正相关或负相关
}
```

#### 4.2 拓扑排序与毫秒级重算流水线
1. **客户端快速求值器**：为保证滑块拖拽时的 60FPS 流畅体验，纯代数驱动关系在前端采用拓扑排序进行内存求值：
   $$\text{simulatedValue} = f(\text{inputs}) \times (1 + \Delta_{\text{rate}})$$
2. **后端确定性校验**：当释放滑块或保存场景时，前端向 Go 后端发送参数变更向量，后端在 DuckDB 内存实例中执行完整 SQL 级重算，返回包含精度校正的标准财务结果与勾稽校验签名。
3. **环路阻断**：画布在节点连线时进行实时拓扑检测（Kahn 算法），严禁引入循环依赖关系。

#### 4.3 交互与视觉规范
- **动因控制条**：每个 Driver 节点内置交互式 Slider 与微调输入框，支持 `[ -50%, +50% ]` 快捷步进调节。
- **状态色彩语义**：
  - 增益效果（有利差异）：深绿色标签与高亮光晕。
  - 损耗效果（不利差异）：深红色标签与警告标识。
  - 中性指标：冷灰色系高对比度文本。
- **瀑布对比抽屉**：点击任意指标节点，展开侧边抽屉，以瀑布图形式展示各上游动因对其绝对变化额的边际贡献。

---

### 5. 验收标准 (Acceptance Criteria)
1. **渲染与流畅度**：画布承载 50 个节点与 80 条边时，缩放、平移与滑块拖动无掉帧，重算延迟 $< 100\text{ms}$。
2. **算术一致性**：前端实时推演值与后端 DuckDB 批量重算结果在两极浮点数精度（$10^{-4}$）下严格吻合。
3. **场景持久化**：用户保存的推演场景支持导出为符合规范的 JSON 文件，重新载入后能完整复原画布拓扑结构与滑块状态。
4. **环路拦截**：尝试建立会导致循环引用的连线时，系统即时拦截并给出清晰的中文与英文错误提示。

---

<a name="english"></a>
## English Specification

### 1. Basic Metadata
- **Requirement ID**: `REQ-0003`
- **Requirement Name**: React Flow Causal Driver Canvas & What-If Simulation
- **Originating Sources**: `SRC-0001` (Interview rounds 4, 7, 10), `SRC-0012` (React Flow / @xyflow/react), `SRC-0014` (DuckDB sub-second in-memory recomputation)
- **Module**: Canvas & Simulation
- **Target Release**: `v0.1`
- **Lifecycle Status**: `defined` (governed in [04-requirement-pool/requirement-pool.md](../../04-requirement-pool/requirement-pool.md))
- **Prerequisites**: `REQ-0002` (Depends on Semantic Metric Engine for baseline actuals and formula metadata)
- **Owner**: Frontend / Fullstack

---

### 2. Business Context & User Pain Points
In conventional financial planning and strategic decision-making:
1. **Opaque Spreadsheet Formula Chains**: Financial models are scattered across thousands of cells and cross-sheet links, leaving executives unable to intuitively grasp how operational drivers (churn, CAC, sales rep productivity) propagate to net profit and cash runway.
2. **Sluggish and Fragile Scenario Modeling**: When leadership asks "If we increase prices by 10% next quarter while churn rises by 2 percentage points, how does our runway change?", FP&A analysts spend days manually cloning sheets, risking broken formula integrity.
3. **Lack of Causal Explainability in Black-Box AI**: LLMs generating financial forecasts often emit direct numbers without visual breakdown of which underlying assumptions drove the outcome, eroding trust.

**Goal**: Build an interactive causal driver tree canvas powered by React Flow. Financial metrics are modeled as an interactive DAG with real-time sliders, instant sensitivity propagation, baseline vs. simulated split comparisons, and sub-100ms cascaded recalculations.

---

### 3. User Stories
- **US-01 (CFO / Executive)**: As a CFO, I want to visually inspect the causal chain of "Revenue = Customers × ARPU" and "Gross Margin = Revenue - COGS" on a canvas, clearly pinpointing strategic operational levers.
- **US-02 (FP&A Analyst)**: As a financial analyst, I want to adjust key drivers via sliders (e.g., Marketing Budget $\pm 20\%$, Conversion Rate $+1.5\%$), triggering real-time DAG recalculations within 100ms that highlight absolute and relative delta shifts across the entire hierarchy.
- **US-03 (Business Unit Leader)**: As a department head, I want to save tuned parameter sets as named scenarios ("Conservative Cost Control" vs. "Aggressive Expansion") and export waterfall charts and variance summaries for executive committee reviews.

---

### 4. Functional Requirements & Technical Implementation Standards

#### 4.1 Canvas Node & Edge Graph Schema
The canvas is built on `@xyflow/react`, defining three node archetypes and directional dependency edges:

```typescript
export type DriverNodeType = 'metric' | 'driver' | 'formula';

export interface DriverNodeData {
  id: string;
  name: string;
  displayName: string;
  category: 'Revenue' | 'Expense' | 'Headcount' | 'KPI';
  nodeType: DriverNodeType;
  baselineValue: number;
  simulatedValue: number;
  adjustmentType: 'percentage' | 'absolute' | 'fixed';
  adjustmentDelta: number; // e.g., +0.10 denotes +10%
  formula?: string; // e.g., "active_customers * arpu"
  unit: 'currency' | 'percent' | 'count';
  historicalTrend?: number[]; // Sparkline trend of past 6 months
}

export interface DriverEdgeData {
  id: string;
  source: string; // Upstream driver node ID
  target: string; // Downstream metric node ID
  weight?: number; // Sensitivity sensitivity factor
  relationship: 'positive' | 'negative';
}
```

#### 4.2 Topological Ordering & Sub-100ms Recalculation Pipeline
1. **Client-Side Fast Evaluator**: For silky 60FPS slider interaction, pure algebraic expressions are evaluated locally in memory using topological sort:
   $$\text{simulatedValue} = f(\text{inputs}) \times (1 + \Delta_{\text{rate}})$$
2. **Backend Deterministic Validation**: On slider release or scenario save, the delta parameter vector is sent to the Go backend, triggering full DuckDB in-memory SQL evaluation with trial-balance and reconciliation verification.
3. **Cycle Prevention**: The canvas enforces strict cycle prevention at edge creation time using Kahn's algorithm, blocking any recursive dependency loops.

#### 4.3 Interaction & Visual Design Standards
- **Driver Control Strips**: Each driver node features an integrated Slider and number input, supporting step-wise adjustments within `[ -50%, +50% ]`.
- **Status Color Semantics**:
  - Favorable variances: High-contrast emerald green accents with subtle glow.
  - Unfavorable variances: Muted crimson red with warning indicator badges.
  - Neutral metrics: Crisp grayscale typography with clear visual hierarchy.
- **Waterfall Decomposition Drawer**: Clicking any metric node opens a drawer displaying marginal driver contributions toward total net variance as a waterfall chart.

---

### 5. Acceptance Criteria
1. **Performance & Responsiveness**: With 50 nodes and 80 edges loaded, panning, zooming, and slider adjustments maintain 60 FPS, with propagation latency $< 100\text{ms}$.
2. **Arithmetic Consistency**: Client-side simulated figures match backend DuckDB evaluation within double-precision floating-point tolerance ($10^{-4}$).
3. **Scenario Persistence**: Scenarios can be exported as standard JSON schema files, completely restoring graph topology and slider states upon import.
4. **Cycle Rejection**: Any attempt to draw a cyclic dependency connection is immediately blocked with bilingual error alerts.
