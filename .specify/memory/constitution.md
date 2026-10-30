<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Added sections: Monorepo Synergy and Synchronized Task Progression
- Modified principles: Added explicit governance rules for multi-repository coordination between frontend (gestion-de-trabajo-becario-web) and backend (gestion-de-trabajo-becario-backend)
- Follow-up TODOs: Ensure both repositories reference or align with this multi-repo synchronization rule.
-->

# MiBeca Dual-Repository Constitution

## Core Principles

### I. Unified Product Contract
Frontend and backend repositories must operate as a cohesive dual-repository system (`gestion-de-trabajo-becario-web` and `gestion-de-trabajo-becario-backend`). API contracts, schemas, and interface definitions are canonical and shared; neither repository may define independent, conflicting mock contracts once integration is underway.

### II. Synchronized Cross-Repository Progression
Development across web and backend repositories MUST proceed in a coordinated manner. When a spec or task in one repository is blocked by an incomplete task in the other repository, developers MUST pivot to advancing the blocking repository's task queue until unblocked. 
- *Rule:* If Web Task N cannot continue because Backend Task M is incomplete, and Backend Task M requires preceding tasks, continue sequentially on backend tasks until backend progress is blocked by a web dependency, and vice-versa.

### III. Test-First & Quality Gates (NON-NEGOTIABLE)
All features, contract integrations, and bug fixes MUST adhere to test-driven development and strict quality gates (`npm run lint`, `npm run build`, and unit/integration tests). No bypassing of checks, lint suppressions, or stubbing without tests is permitted.

### IV. Canonical API & Theme Alignment
The frontend MUST consume the backend API through declared endpoints (`src/api/endpoints.js` in the web repo) and use shared styling variables (`src/styles/theme.css`), maintaining complete accessibility and mobile-responsive standards.

### V. Simplicity, YAGNI & Incremental Delivery
Deliver work in thin, verifiable, atomic slices. Avoid over-engineering, unrequested abstractions, or parallel custom specs. Every component or endpoint must directly serve the MVP plan.

## Inter-Repository Coordination & Workflow

Frontend and backend repositories share a interdependent delivery pipeline. Coordination rules:
1. **Dependency Blocking Rule:** Cross-project dependencies dictate immediate task switching. Never idle when blocked by another repository's incomplete dependency; switch context to the blocking repository to unblock the critical path.
2. **Version Alignment:** Major milestone specifications must be synchronized across both repositories to ensure feature parity and contract consistency.

## Development Standards & Review Process

1. **Code Review & Quality:** All changes must pass linting, type checking, and test suites locally before PR submission.
2. **Security & Auth:** Backend enforces actual authorization and role security; frontend respects these permissions without client-side permission bypasses.
3. **Documentation:** Architectural decisions, API contract modifications, and core changes must be recorded in project documentation.

## Governance

This Constitution supersedes all other practices and informal guidelines across both MiBeca repositories. Amendments require documentation, explicit team agreement, and a migration plan. Compliance is verified during code reviews, automated PR quality gates, and spec validation.

**Version**: 1.1.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30
