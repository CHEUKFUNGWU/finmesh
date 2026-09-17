# 目录职责与命名约定 / Directory Responsibilities & Naming Conventions

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文规则

### 1. 目录职责表

编号前缀的作用：在文件管理器和代码编辑器中按名称排序时，即为工作流的自然推进顺序。

| 目录 | 职责说明 | 允许存放的内容 | 禁止存放的内容 |
| :--- | :--- | :--- | :--- |
| **`00-rules/`** | 规则与模板 | 工作流规范、命名规则、模板文件、检查清单 | 具体的业务需求、讨论纪要 |
| **`01-inputs/`** | 原始输入 | 客户访谈纪要、历史文档、外部竞品材料、截图 | 未经登记的临时文档、已改写的正式方案 |
| **`02-product/`** | 稳定产品事实 | 业务术语表、产品全景白皮书、系统基线能力、技术约束 | 尚未确定的临时假设、特定单版本需求细节 |
| **`03-planning/`** | 跨需求规划 | 问题空间定义、模块地图（Module Map）、架构与产品决策日志（Decision Log） | 单个需求的详细 PRD/原型 |
| **`04-requirement-pool/`** | 需求池 | 候选需求登记表、需求状态跟踪、需求优先级评估 | 需求的完整分析过程和设计细节 |
| **`05-requirements/`** | 单需求工作包 | 每个独立需求专属子目录（PRD、交互原型草图、用例设计） | 跨需求的全局规划、原始未加工输入 |
| **`06-versions/`** | 版本管理 | 目标版本范围承诺（Scope）、版本发布计划、里程碑跟踪 | 单个需求的详细设计（应链接至 05 目录） |
| **`07-reviews/`** | 评审与验收 | 需求评审纪要、上线验收报告、版本迭代复盘 | 正在进行中的草稿方案 |
| **`90-assets/`** | 共享资产 | 演示文稿、高保真原型截图、架构高清矢量图、通用附件 | 文本格式的需求或规则说明 |
| **`99-archive/`** | 历史归档 | 已废弃、已关闭或被完全重写的过期方案与材料 | 处于活跃状态的规范与需求 |

### 2. 命名约定

统一的命名规范是自动化检索与团队/AI 协同的基础：

1. **Markdown 文件**：
   - 必须使用英文小写字母与短横线连接（`kebab-case`）。
   - 示例：`problem-space.md`、`decision-log.md`、`semantic-metric-layer.md`。
2. **日期属性材料（输入、纪要、评审）**：
   - 格式：`YYYY-MM-DD-<主题英文或拼音短横线>`
   - 示例：`2026-09-17-fpna-cfo-interview.md`、`2026-09-18-architecture-review.md`。
3. **单需求目录（位于 `05-requirements/` 下）**：
   - 格式：`req-<四位递增编号>-<英文短名称>`
   - 示例：`req-0001-smart-csv-ingestion`、`req-0002-react-flow-whatif-canvas`。
4. **版本目录（位于 `06-versions/` 下）**：
   - 格式：`v<主版本>.<次版本>`
   - 示例：`v0.1`、`v1.0`。

---

<a name="english"></a>
## English Rules

### 1. Directory Responsibilities Matrix

Role of numbered prefixes: Sorting files alphabetically in file managers and code editors naturally reflects the sequential execution order of the product workflow.

| Directory | Responsibility | Allowed Contents | Prohibited Contents |
| :--- | :--- | :--- | :--- |
| **`00-rules/`** | Rules & Templates | Workflow standards, naming rules, templates, checklists | Specific business requirements, meeting minutes |
| **`01-inputs/`** | Raw Inputs | Customer interview notes, legacy docs, competitor references, screenshots | Unregistered ad-hoc documents, rewritten formal proposals |
| **`02-product/`** | Stable Product Facts | Business glossary, architecture whitepaper, baseline capabilities, constraints | Unverified ad-hoc hypotheses, single-release requirement details |
| **`03-planning/`** | Cross-Requirement Planning | Problem space, module maps, architecture & product decision logs | Detailed PRDs / prototypes for a single requirement |
| **`04-requirement-pool/`** | Requirement Pool | Candidate requirement register, status tracking, priority assessment | Full analysis workflows and granular design specs |
| **`05-requirements/`** | Requirement Packages | Dedicated subdirectories per requirement (PRD, interactive sketches, test cases) | Cross-cutting global plans, unprocessed raw inputs |
| **`06-versions/`** | Version Management | Target release scope commitments, release plans, milestone tracking | Detailed requirement designs (must link to `05-requirements/`) |
| **`07-reviews/`** | Reviews & Acceptance | Requirement review notes, production acceptance checklists, postmortems | Ongoing work-in-progress draft proposals |
| **`90-assets/`** | Shared Assets | Slide decks, high-fidelity mockups, vector diagrams, shared attachments | Text-based requirements or workflow rule descriptions |
| **`99-archive/`** | Historical Archive | Deprecated, closed, or completely superseded legacy documents | Active standards, living requirements, and active plans |

### 2. Naming Conventions

Standardized naming is essential for automated indexing, tooling, and human/AI collaboration:

1. **Markdown Files**:
   - Must use lowercase English letters connected with hyphens (`kebab-case`).
   - Examples: `problem-space.md`, `decision-log.md`, `semantic-metric-layer.md`.
2. **Date-stamped Materials (Inputs, Minutes, Reviews)**:
   - Format: `YYYY-MM-DD-<english-topic-in-kebab-case>`.
   - Examples: `2026-09-17-fpna-cfo-interview.md`, `2026-09-18-architecture-review.md`.
3. **Requirement Package Directories (under `05-requirements/`)**:
   - Format: `req-<4-digit-incremental-number>-<short-name>`.
   - Examples: `req-0001-smart-csv-ingestion`, `req-0002-react-flow-whatif-canvas`.
4. **Release Version Directories (under `06-versions/`)**:
   - Format: `v<major>.<minor>`.
   - Examples: `v0.1`, `v1.0`.

