---
title: "Runbook: Local Development Setup"
type: runbook
domain: all
status: active
tags:
  - domain/all
  - status/active
  - type/runbook
---

# Runbook: Local Development Setup

> [!context]
> How to set up OpenCaptions for local development from scratch. Covers the Bun/TypeScript monorepo and the Python extraction backends.

## Pre-Flight Checklist

- [ ] Node.js >= 18 installed
- [ ] Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- [ ] Git installed
- [ ] Python >= 3.10 installed (for backend-av extraction)
- [ ] ffmpeg installed (`brew install ffmpeg` on macOS)

## Steps

### 1. Clone the repository

```bash
git clone https://github.com/broomva/opencaptions.git
cd opencaptions
```

### 2. Install JavaScript dependencies

```bash
bun install
```

### 3. Install Python dependencies (extraction backends)

The `setup` command installs `whisper.cpp`, `pyannote-audio`, and `parselmouth` into a managed virtualenv:

```bash
opencaptions setup
```

> [!tip]
> If the CLI is not yet on your PATH, run it directly: `bun run packages/cli/src/index.ts setup`

### 4. Verify the installation

The `doctor` command checks that all required tools are available and correctly configured:

```bash
opencaptions doctor
```

This verifies:
- Bun version and monorepo structure
- Python version and virtualenv
- ffmpeg availability
- whisper.cpp model downloaded
- pyannote auth token configured

### 5. Build all packages

```bash
bun run build
```

This runs `turbo build` across all packages in dependency order. Equivalent to:

```bash
turbo build --filter=@opencaptions/*
```

### 6. Run on a test video

```bash
opencaptions generate sample.mp4
```

This runs the full pipeline: transcription, diarization, intent extraction, rules mapping, validation, and renders ANSI output to the terminal.

Add `--format webvtt` for WebVTT output:

```bash
opencaptions generate sample.mp4 --format webvtt -o sample.vtt
```

### 7. Set up web apps (optional)

If you are working on the landing page, dashboard, or API:

```bash
# Copy example env files
cp apps/app/.env.example apps/app/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# Start all apps in dev mode
bun run dev
```

## Development Workflow

### Editing packages

After changing code in any `packages/*` directory, rebuild the affected packages:

```bash
# Rebuild a specific package
turbo build --filter=@opencaptions/spec

# Rebuild all OpenCaptions packages
turbo build --filter=@opencaptions/*

# Rebuild everything (including next-forge infra)
bun run build
```

### Running checks

```bash
# Lint + typecheck
make -f Makefile.control check

# Quick smoke test (~120s)
make -f Makefile.control smoke

# Full CI pipeline (~600s)
make -f Makefile.control ci
```

### CLI commands reference

```bash
opencaptions generate <video>     # Run full CWI pipeline
opencaptions validate <cwi.json>  # Validate a CWI document against 12 rules
opencaptions preview <cwi.json>   # Render ANSI preview in terminal
opencaptions export <cwi.json>    # Export to WebVTT
opencaptions telemetry            # Manage opt-in telemetry
opencaptions setup                # Install Python dependencies
opencaptions doctor               # Verify installation
```

## Verification

| Check | Expected Result |
|-------|-----------------|
| `opencaptions doctor` | All checks pass |
| `bun run build` | All packages build |
| `make -f Makefile.control check` | Lint + typecheck pass |
| `opencaptions generate sample.mp4` | CWI output rendered |
| `localhost:3000` | Dashboard loads (if web apps started) |
| `localhost:3001` | Landing page loads (if web apps started) |

## Related

- [[architecture/overview]]
- [[glossary]]
