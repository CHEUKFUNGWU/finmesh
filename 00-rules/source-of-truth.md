# 唯一事实源 / Single Source of Truth

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规则

### 1. 核心原则

> **每类信息在且仅在一个专属位置维护；其他任何文档需要用到该信息时，必须通过 Markdown 相对路径引用，严禁复制粘贴。**

### 2. 信息类型与唯一维护位置映射

| 信息分类 | 唯一维护文件/位置 | 引用规范 |
| :--- | :--- | :--- |
| **原始输入材料** | `01-inputs/source-register.md` | 引用对应的 `SRC-XXXX` 编号与链接 |
| **通用业务术语与定义** | `02-product/glossary.md` | 使用统一定义，不自行造词 |
| **平台基线与架构事实** | `02-product/architecture-whitepaper.md` | 引用章节，不随意假设系统无该能力 |
| **跨需求决策与取舍** | `03-planning/decision-log.md` | 引用决策编号 `DEC-XXXX` |
| **需求当前生命周期状态** | `04-requirement-pool/requirement-pool.md` | 状态以需求池为准，需求包内不重复维护独立状态字段 |
| **单个需求的功能与交互** | `05-requirements/req-XXXX-<name>/` | 评审、版本规划统一指向该需求包 |
| **版本承诺与交付范围** | `06-versions/<version>/scope.md` | 开发排期与验收严格以该 scope 为准 |

### 3. 协作守则

1. **改源头，不改引用**：当术语定义、架构设计或需求发生实质变更时，直接修改其唯一维护位置，所有引用处自动生效。
2. **禁止文档多头分裂**：严禁私自创建“需求汇总汇总版.docx”或“最新最终修改版.md”。所有内容必须进 Git，以当前主分支文件为准。
3. **数字与事实校验**：引用历史指标、客户原话或接口字段时，必须携带源头出处。

---

<a name="english"></a>
## English Rules

### 1. Core Principle

> **Every class of information is maintained in exactly one designated location. Any other document requiring this information must reference it via a relative Markdown link; copying and pasting is strictly prohibited.**

### 2. Information Types & Single Source of Truth Mapping

| Information Category | Canonical File / Location | Reference Rule |
| :--- | :--- | :--- |
| **Raw Input Materials** | `01-inputs/source-register.md` | Reference corresponding `SRC-XXXX` ID and link |
| **Business Terms & Definitions** | `02-product/glossary.md` | Use standard definitions; do not coin ad-hoc terms |
| **Platform Baseline & Architecture** | `02-product/architecture-whitepaper.md` | Reference sections; do not assume capabilities are absent |
| **Cross-Requirement Decisions** | `03-planning/decision-log.md` | Reference decision ID `DEC-XXXX` |
| **Requirement Lifecycle Status** | `04-requirement-pool/requirement-pool.md` | Pool is canonical; do not maintain redundant status fields in PRDs |
| **Individual Requirement Specs** | `05-requirements/req-XXXX-<name>/` | Reviews and version planning point directly to the package |
| **Release Scope Commitments** | `06-versions/<version>/scope.md` | Development schedules and acceptance strictly follow this scope |

### 3. Collaboration Discipline

1. **Modify the source, not references**: When a term definition, architecture design, or requirement changes substantively, update its single maintenance location directly. All references will immediately reflect the update.
2. **Prevent document fragmentation**: Never create ad-hoc copies like "Requirements_Summary_Final_v2.docx" or "Latest_Modifications.md". All content must be committed to Git, and the current main branch is authoritative.
3. **Verify metrics and facts**: When quoting historical metrics, customer statements, or API fields, always cite the canonical origin.

