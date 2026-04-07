# CLAUDE.md — OpenCaptions

## Project

OpenCaptions — open-source CWI (Caption with Intention) video understanding pipeline.
Built on next-forge (Turborepo + Next.js) with symphony-forge metalayer.

## What This Is

OpenCaptions generates Caption with Intention (CWI) compliant captions by extracting cinematic intent from video — pitch, volume, emotion, emphasis, sarcasm, pacing — then renders that felt experience as CWI visual language (color-coded attribution, word-level synchronization, variable-font intonation).

CWI is the Oscar-winning (2025) captioning standard by FCB Chicago + Chicago Hearing Society.

## Architecture

```
VideoInput
  → TranscriptBackend (V1: whisper.cpp)
  → DiarizationBackend (V1: pyannote-audio)
  → IntentExtractorBackend (V1: audio+vision, V2: V-JEPA2, V3: TRIBE v2)
  → IntentMapper (V1: RulesMapper, V2: LearnedMapper, V3: NeuralMapper)
  → CWIValidator → ValidationReport
  → TracingCollector (opt-in feedback flywheel)
```

## Stack

- next-forge (Turborepo + Next.js 15) + symphony-forge metalayer
- Bun as package manager
- Biome for linting (never ESLint/Prettier)
- TypeScript strict mode, ES2022 target

## Package Structure

### OpenCaptions packages (`@opencaptions/*`)
```
packages/
├── types/       — Zero-dep TypeScript types + constants (foundation)
├── spec/        — 12-rule CWI validation engine (ATT/SYN/INT/FCC)
├── layout/      — Word geometry engine (Pretext-compatible)
├── pipeline/    — Orchestrator + RulesMapper + backend interfaces
├── backend-av/  — V1 extractor (Whisper + pyannote + parselmouth)
├── backend-jepa/— V2 extractor stub (Phase 3)
├── renderer/    — Terminal renderer (ANSI) + WebVTT exporter
├── mcp/         — MCP server stub (Phase 2)
├── tracing/     — Telemetry + correction collection
└── cli/         — Bun CLI: generate, validate, preview, export, telemetry
```

### next-forge infrastructure (`@repo/*`)
```
packages/
├── auth/           — Better Auth (dashboard login)
├── payments/       — Stripe (staircase pricing)
├── database/       — Prisma (report storage)
├── design-system/  — shadcn/ui components
├── analytics/      — Usage tracking
├── observability/  — Error tracking + logging
└── typescript-config/ — Shared TS configs
```

### Apps
```
apps/
├── web/    — Landing page (opencaptions.tools)
├── app/    — Dashboard (reports, badges, billing)
├── api/    — Hosted pipeline API
└── docs/   — Documentation (Mintlify)
```

## Commands

- `bun install` — install dependencies
- `bun run dev` — start all apps in dev mode
- `bun run build` — build all apps and packages
- `bun run check` — lint all packages
- `make -f Makefile.control smoke` — quick validation (~120s)
- `make -f Makefile.control check` — lint + typecheck (~60s)
- `make -f Makefile.control ci` — full pipeline (~600s)
- `make -f Makefile.control audit` — entropy audit

## Conventions

- App Router (Next.js) — no pages/ directory
- Server Components by default, 'use client' only when needed
- Shared UI in packages/design-system
- Database schema in packages/database (Prisma)
- Our packages use `tsc` for builds (not tsup)
- Our packages extend `@repo/typescript-config/base.json`

## Knowledge Graph

The knowledge graph lives in `docs/` using Obsidian-flavored Markdown.

- **Entry point**: `docs/_index.md`
- **Architecture**: `docs/architecture/`
- **Decisions**: `docs/decisions/`
- **Runbooks**: `docs/runbooks/`
- **Templates**: `docs/_templates/`

## Control Harness

- **`.control/policy.yaml`** — Risk gates
- **`.control/commands.yaml`** — Canonical commands
- **`.control/topology.yaml`** — Repo map
- **`.control/egri.yaml`** — EGRI self-improvement loop
- **`scripts/harness/`** — Automation scripts
- **`Makefile.control`** — Control targets

## Key Design Decisions

1. **Pluggable backends**: All extraction backends implement typed interfaces. V1→audio+vision, V2→V-JEPA2, V3→TRIBE v2. Same types throughout.
2. **RulesMapper is V1**: Pure math (lerp). LearnedMapper V2 trained on correction data.
3. **NeuralMapper is V3**: Brain ROI activations → CWI styling. Captions represent what the viewer's brain WOULD FEEL.
4. **Tracing is the moat**: Correction data accumulates → training data for learned mapper.
5. **Lighthouse model**: We measure, not certify. Validation report URL is the shareable artifact.
6. **Staircase pricing**: Free CLI → Starter $9 → Pro $29 → Studio $99 → Enterprise.

## Linear Tickets (BRO-520 through BRO-546)

### Phase 1 — Implemented
BRO-520 through BRO-528, BRO-538, BRO-544: All core packages + CI/CD + NeuralPrediction schema ✅

### Phase 1 — Remaining
- BRO-529: Sample CWI documents + test fixtures
- BRO-540: Python dependency installer + setup wizard
- BRO-537: Landing page + docs site

### Phase 2 — API + Dashboard
BRO-530 (API), BRO-531 (dashboard), BRO-534 (MCP), BRO-535 (AE/Premiere), BRO-536 (telemetry backend)

### Phase 3 — World Model + Learned Mapper
BRO-532 (V-JEPA2), BRO-533 (LearnedMapper V2)

### Phase 3.5 — TRIBE v2 Neural Intent
BRO-541 (POC), BRO-542 (backend-tribe), BRO-543 (NeuralMapper), BRO-545 (Deaf reviewer study)

### Phase 4 — Ecosystem
BRO-539 (community), BRO-546 (OpenMontage integration)

## npm Publishing

- **Scope**: `@opencaptions/*` | **Org**: `opencaptions` (broomva = owner)
- Run `./scripts/publish-all.sh` (passkey auth per package via `bun publish`)

## CWI Animation Spec (from FCB Chicago)

- Animation: ease curve, 100ms delay, 600ms duration
- Word transition: white → speaker color
- Emphasis: 15% size bounce upward
- Font: Roboto Flex (variable, weight = pitch, size = volume)
- Speaker colors: 12-color WCAG AA palette in types/src/index.ts

## Working Protocol

1. Read `AGENTS.md` — understand commands, constraints
2. Traverse `docs/_index.md` — domain-specific docs
3. Check policy — `make -f Makefile.control policy-check`
4. Implement — follow constraints
5. Update docs — schema/API/env changes need doc updates
6. Run checks — `make -f Makefile.control check` before commit
