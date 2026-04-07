# OpenCaptions

> Feel the film. Render the intent.

Open-source video understanding pipeline that generates [Caption with Intention (CWI)](https://www.captionwithintention.org/) compliant captions by extracting cinematic intent from video.

Built on [next-forge](https://github.com/vercel/next-forge) + [symphony-forge](https://github.com/broomva/symphony-forge).

## What is this?

Caption with Intention won an Oscar (2025) and two Cannes Lions Grand Prix. It transforms flat, static captions into expressive visual storytelling through:

- **Attribution** — color-coded speaker identification
- **Synchronization** — word-by-word animation synced to speech
- **Intonation** — variable font weight and size conveying pitch, volume, and emotion

OpenCaptions is the first programmatic toolchain for CWI. Point it at a video, and it extracts intent — pitch, volume, emotion, emphasis, sarcasm, pacing — then renders that felt experience as CWI visual language.

## Quick Start

```bash
# Install
npx opencaptions setup

# Generate CWI captions from a video
npx opencaptions generate film.mp4

# Validate a CWI document
npx opencaptions validate film.cwi.json

# Preview in terminal
npx opencaptions preview film.cwi.json

# Export to WebVTT (FCC-compliant fallback)
npx opencaptions export film.cwi.json --format webvtt
```

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

## Packages

### CWI Pipeline (`@opencaptions/*`)

| Package | Description |
|---------|-------------|
| `@opencaptions/types` | Core TypeScript types + JSON Schema |
| `@opencaptions/spec` | 12-rule CWI validation engine |
| `@opencaptions/layout` | Pretext-compatible word geometry |
| `@opencaptions/pipeline` | Orchestrator + RulesMapper |
| `@opencaptions/backend-av` | V1: Whisper + pyannote + audio analysis |
| `@opencaptions/renderer` | Terminal renderer + WebVTT exporter |
| `@opencaptions/tracing` | Opt-in anonymous telemetry |
| `@opencaptions/mcp` | MCP server for AI agents |
| `opencaptions` | Bun CLI |

### Infrastructure (`@repo/*`)

| Package | Description |
|---------|-------------|
| `@repo/auth` | Authentication (Better Auth) |
| `@repo/payments` | Billing (Stripe) |
| `@repo/database` | Data layer (Prisma) |
| `@repo/design-system` | UI components (shadcn/ui) |

### Apps

| App | Description |
|-----|-------------|
| `apps/web` | Landing page — opencaptions.tools |
| `apps/app` | Dashboard — reports, badges, billing |
| `apps/api` | Hosted pipeline API |
| `apps/docs` | Documentation (Mintlify) |

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Development mode
bun run dev

# Lint
bun run check

# Control harness
make -f Makefile.control smoke    # Quick validation
make -f Makefile.control check    # Lint + typecheck
make -f Makefile.control ci       # Full pipeline
make -f Makefile.control audit    # Entropy audit
```

## Pricing

| Tier | Price | Included | Overage |
|------|-------|----------|---------|
| Free | $0 | CLI, unlimited local | — |
| Starter | $9/mo | 30 min API | $0.50/min |
| Pro | $29/mo | 200 min API | $0.25/min |
| Studio | $99/mo | 1,000 min API | $0.15/min |
| Enterprise | Custom | Unlimited | Negotiated |

## License

MIT
