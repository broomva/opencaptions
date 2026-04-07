# AGENTS.md — next-forge Agent Guide

This is the entry point for AI coding agents working on next-forge.
Read this file first. Follow the protocols exactly.

## Quick Start

1. **Read this file** completely before doing any work.
2. **Traverse the knowledge graph** starting at `docs/_index.md`.
3. **Check policy gates** — run `bash scripts/harness/check-policy.sh` to see if your changes trigger any policies.
4. **Implement changes** following the constraints below.
5. **Update documentation** — any code change that affects architecture, APIs, schemas, or env vars must have a corresponding doc update.
6. **Run checks** — `make -f Makefile.control check` before committing.


## Repository Structure

| Path | Type | Description |
|------|------|-------------|
| `apps/app` | Next.js | Main application (port 3000) |
| `apps/api` | Next.js | API server (port 3002) |
| `apps/web` | Next.js | Marketing site (port 3001) |
| `apps/docs` | Docs | Public documentation |
| `apps/email` | React Email | Email templates |
| `apps/storybook` | Storybook | Component explorer |
| `packages/database` | Prisma | ORM + schema |
| `packages/design-system` | shadcn/ui | Shared UI components |
| `packages/auth` | Auth | Authentication |
| `.control/` | YAML | Policy gates, commands, topology |
| `docs/` | Markdown | Knowledge graph (Obsidian-flavored) |
| `scripts/harness/` | Bash | Automation scripts |


## Commands

All commands are defined in `.control/commands.yaml` and accessible via `Makefile.control`:

| Command | What it does | When to use |
|---------|-------------|-------------|
| `make -f Makefile.control smoke` | Install + check + build app | After pulling changes |
| `make -f Makefile.control check` | Lint + typecheck | Before every commit |
| `make -f Makefile.control test` | Run test suite | Before pushing |
| `make -f Makefile.control build` | Full build | Before deploy |
| `make -f Makefile.control ci` | check + test + build | Full local CI simulation |
| `make -f Makefile.control docs-check` | Verify docs freshness | After docs/ changes |
| `make -f Makefile.control policy-check` | Policy gate warnings | Before committing |
| `make -f Makefile.control audit` | Full entropy audit | Periodic health check |

Direct bun commands also work:
- `bun install` — install dependencies
- `bun run dev` — start all apps in dev mode
- `bun run build` — build all apps
- `bun run test` — run tests
- `bun run check` — lint


## Constraints

These are hard rules. Violations will be caught by CI or pre-commit hooks.

1. **App Router only** — No `pages/` directory. All routes use Next.js App Router.
2. **Server Components by default** — Only add `'use client'` when the component needs browser APIs, hooks, or event handlers.
3. **Prisma for database** — All schema changes go through the Prisma schema.
4. **No secrets in code** — Environment variables go in `.env.local` (gitignored).
5. **Workspace imports** — Use `@repo/<package>` imports. Never use relative paths across package boundaries.
6. **Update docs on schema changes** — Any change to the database schema, API contracts, or environment variables requires a documentation update.
7. **ADR for architectural decisions** — Major changes need an Architecture Decision Record in `docs/decisions/`.
8. **Policy compliance** — Check `.control/policy.yaml` for risk gates before committing high-risk changes.
9. **TypeScript strict mode** — `noEmit` typecheck must pass. No `any` types without justification.

## Knowledge Graph Traversal

The knowledge graph lives in `docs/` using Obsidian-flavored Markdown:

### Entry Point
Start at `docs/_index.md`. It contains:
- The full graph map (every document listed)
- Tag taxonomy for filtering
- Traversal instructions for different tasks

### Loading Order
When starting a task:
1. Read `docs/_index.md` to orient
2. Read the domain-specific architecture doc
3. Read related ADRs in `docs/decisions/`
4. Read the relevant runbook if performing an operational task

### Linking Conventions
- Wikilinks: `[[architecture/overview]]` links to `docs/architecture/overview.md`
- Callouts: `> [!decision]`, `> [!warning]`, `> [!context]`
- Diagrams: Mermaid code blocks for system diagrams

## Pre-Push Checklist

Before pushing any branch:

- [ ] Documentation updated for any schema, API, or env var changes
- [ ] `make -f Makefile.control check` passes (lint + typecheck)
- [ ] `make -f Makefile.control test` passes
- [ ] `make -f Makefile.control policy-check` reviewed
- [ ] `docs/_index.md` updated if new docs were added
- [ ] No broken `[[wikilinks]]`
- [ ] Commit messages are clear and reference relevant context

