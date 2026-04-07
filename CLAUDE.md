# OpenCaptions — Project Context

## What This Is

OpenCaptions is an open-source video understanding pipeline that generates **Caption with Intention (CWI)** compliant captions. CWI is the Oscar-winning (2025) captioning standard by FCB Chicago + Chicago Hearing Society that transforms flat static captions into expressive visual storytelling through attribution (speaker colors), synchronization (word-level animation), and intonation (variable font weight/size conveying pitch and volume).

OpenCaptions is the first programmatic toolchain for CWI. It extracts cinematic intent from video — pitch, volume, emotion, emphasis, sarcasm, pacing — then renders that felt experience as CWI visual language.

## Architecture

```
VideoInput
  → TranscriptBackend (V1: whisper.cpp)
  → DiarizationBackend (V1: pyannote-audio)
  → IntentExtractorBackend (V1: audio+vision, V2: V-JEPA2)
  → IntentMapper (V1: RulesMapper, V2: LearnedMapper)
  → CWIValidator → ValidationReport
  → TracingCollector (opt-in feedback flywheel)
```

## Package Structure

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

Dependency graph (no cycles):
```
types ← spec, layout, pipeline, tracing (Layer 2 — all independent)
pipeline ← backend-av, backend-jepa, mcp (Layer 3)
layout ← renderer (Layer 3)
pipeline + backend-av + renderer + tracing + spec ← cli (Layer 4)
```

## Conventions

- **Package manager**: Bun (1.3+)
- **Build**: Turborepo (`turbo build`)
- **Linter**: Biome (never ESLint/Prettier)
- **TypeScript**: Strict mode, ES2022 target, ESNext modules
- **Formatting**: Tabs, double quotes, semicolons, 100 char line width
- **Testing**: `bun test`
- **License**: MIT

## Key Design Decisions

1. **Pluggable backends**: All extraction backends implement typed interfaces. V1 uses audio+vision tools via subprocess. V2 will swap in V-JEPA2 world model embeddings. Same types throughout.
2. **RulesMapper is V1**: Pure math (lerp functions). Deterministic, auditable. LearnedMapper V2 will be trained on correction data from the telemetry flywheel.
3. **Tracing is the moat**: The anonymous correction data (MapperCorrection) accumulates into training data for the learned mapper. The instrument improves with use.
4. **Lighthouse model**: We don't certify — we measure. The validation report URL is the shareable artifact studios cite.
5. **Staircase pricing**: Free CLI (unlimited local) → Starter $9 → Pro $29 → Studio $99 → Enterprise. Overage billing at each tier makes upgrades self-evident.

## Linear Tickets (BRO-520 through BRO-540)

### Phase 1 — Implemented (BRO-520 through BRO-528, BRO-538)
- BRO-520: Project scaffolding ✅
- BRO-521: @opencaptions/types ✅
- BRO-522: @opencaptions/spec ✅
- BRO-523: @opencaptions/layout ✅
- BRO-524: @opencaptions/pipeline ✅
- BRO-525: @opencaptions/backend-av ✅
- BRO-526: @opencaptions/renderer ✅
- BRO-527: @opencaptions/tracing ✅
- BRO-528: @opencaptions/cli ✅
- BRO-538: CI/CD (GitHub Actions workflow) ✅

### Phase 1 — Remaining
- BRO-529: Sample CWI documents + test fixtures
- BRO-540: Python dependency installer + setup wizard
- BRO-537: Landing page + docs site

### Phase 2 — API + Dashboard
- BRO-530: Hosted API + credit billing
- BRO-531: Web dashboard
- BRO-534: MCP server for agent integration
- BRO-535: AE/Premiere export plugins
- BRO-536: Telemetry ingestion backend

### Phase 3 — World Model + Learned Mapper
- BRO-532: V-JEPA2 backend
- BRO-533: LearnedMapper V2

### Phase 4 — Ecosystem
- BRO-539: Community outreach

## npm Publishing

- **Scope**: `@opencaptions/*`
- **npm org**: `opencaptions` (needs to be created at npmjs.com/org/create)
- **Not yet published** — org creation pending
- Publish order must respect dependency chain: types → spec/layout/pipeline/tracing → backend-av/renderer → cli

## Design Spec

Full design document at: `~/broomva/docs/superpowers/specs/2026-04-06-opencaptions-design.md`

## CWI Animation Spec (from FCB Chicago)

- Animation curve: ease
- Animation delay: 100ms
- Animation duration: 600ms
- Word transition: white → speaker color
- Emphasis: 15% size bounce upward
- Font: Roboto Flex (variable font, weight = pitch, size = volume)
- Speaker colors: 12-color WCAG AA palette defined in types/src/index.ts
