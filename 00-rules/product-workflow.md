# 产品工作流规范 / Product Workflow

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规则

### 1. 总体推进流水线

```text
原始输入 (01-inputs)
    ↓
产品认知与规划 (02-product & 03-planning)
    ↓
需求池候选登记 (04-requirement-pool)
    ↓
单需求完整定义 (05-requirements)
    ↓
版本规划与承诺 (06-versions)
    ↓
研发实施与联调
    ↓
验收验证与评审 (07-reviews)
    ↓
线上发布与复盘 (07-reviews / 99-archive)
```

### 2. 各阶段执行规范

#### 第一步：原始输入登记
- 外部文档、会议记录、客户原声或竞品截图，首先登记于 `01-inputs/source-register.md`，分配唯一的 `SRC-XXXX` 编号。
- **纪律**：原始输入不直接等同于正式需求，严禁跳过登记直接动手写代码。

#### 第二步：认知沉淀与跨需求规划
- 将输入提炼为稳定事实（业务术语写入 `02-product/glossary.md`，基线事实写入 `02-product/`）。
- 梳理跨需求的问题空间与架构影响（写入 `03-planning/problem-space.md`），若有重大分歧，记录在 `03-planning/decision-log.md`。

#### 第三步：需求池跟踪
- 评估该想法的业务价值与优先级（P0/P1/P2/P3），并在 `04-requirement-pool/requirement-pool.md` 登记入池。

#### 第四步：单需求包深化
- 在 `05-requirements/req-XXXX-<name>/` 下创建专属子目录，编写 PRD、交互原型与验收条件。
- **纪律**：一个需求工作包应能**独立定义、独立评审、独立开发、独立验收**。

#### 第五步：版本承诺与研发验收
- 将成熟需求纳入 `06-versions/vX.Y/scope.md` 作为版本发布承诺。
- 开发完成并在测试环境部署后，执行严格对比验收，验收纪要与复盘报告沉淀于 `07-reviews/`。

### 3. 核心协作纪律

1. **先确认，后落盘**：当阶段性讨论或方案形成结论时，必须先跟业务/技术负责人达成一致，再落盘或修改文档，严禁 AI 或团队成员单方面擅自篡改已确认的文件。
2. **证据闭环**：每一项产品判断须在文档中显式标注置信等级：`已观察`（有真实证据）、`推断`（逻辑推导）、`待确认`（需进一步验证）、`未覆盖`（当前边界之外）。

---

<a name="english"></a>
## English Rules

### 1. Overall Execution Pipeline

```text
Raw Inputs (01-inputs)
    ↓
Product Cognition & Planning (02-product & 03-planning)
    ↓
Requirement Pool Candidate Registration (04-requirement-pool)
    ↓
Single Requirement Definition (05-requirements)
    ↓
Version Scope Commitment (06-versions)
    ↓
Engineering Implementation & Integration
    ↓
Acceptance Verification & Review (07-reviews)
    ↓
Production Release & Retrospective (07-reviews / 99-archive)
```

### 2. Stage Execution Guidelines

#### Step 1: Raw Input Registration
- External docs, meeting notes, customer feedback, or competitor screenshots must first be logged in `01-inputs/source-register.md` with a unique `SRC-XXXX` ID.
- **Discipline**: Raw inputs do not equate to formal requirements; jumping straight to coding without registration is prohibited.

#### Step 2: Cognition Distillation & Cross-Requirement Planning
- Distill raw inputs into stable facts (business terms in `02-product/glossary.md`, baseline platform facts in `02-product/`).
- Map cross-cutting problem spaces and architectural impacts (`03-planning/problem-space.md`); document major trade-offs in `03-planning/decision-log.md`.

#### Step 3: Requirement Pool Tracking
- Evaluate business value and priority (`P0/P1/P2/P3`), registering candidate items into `04-requirement-pool/requirement-pool.md`.

#### Step 4: Requirement Package Deepening
- Create a dedicated subdirectory under `05-requirements/req-XXXX-<name>/` to draft PRDs, interaction mockups, and acceptance criteria.
- **Discipline**: Each requirement package must be **independently definable, reviewable, implementable, and testable**.

#### Step 5: Version Commitment & Acceptance
- Allocate mature requirements to `06-versions/vX.Y/scope.md` as committed release deliverables.
- Upon development and deployment to test environments, execute strict verification against PRD criteria. Log review minutes and postmortems in `07-reviews/`.

### 3. Core Collaboration Disciplines

1. **Confirm before committing**: When interim discussions or proposals reach a conclusion, align with business/tech leads before committing or modifying documents. AI or team members must never unilaterally alter confirmed files.
2. **Evidence-backed assertions**: Every product judgment must explicitly declare its confidence level: `Observed` (verified with real evidence), `Inferred` (logical deduction), `To-Confirm` (requires validation), `Uncovered` (outside current boundaries).

