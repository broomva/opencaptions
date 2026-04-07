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
> How to set up next-forge for local development from scratch.

## Pre-Flight Checklist

- [ ] Node.js >= 18 installed
- [ ] Bun installed
- [ ] Git installed

## Steps

### 1. Clone the repository

```bash
git clone <repository-url>
cd next-forge
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

```bash
# Copy example env files
cp apps/app/.env.example apps/app/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

### 4. Start development server

```bash
bun run dev
```

### 5. Verify setup

```bash
make -f Makefile.control smoke
```

## Verification

| Check | Expected Result |
|-------|-----------------|
| `make -f Makefile.control check` | Lint + typecheck pass |
| `localhost:3000` | Dashboard loads |
| `localhost:3001` | Marketing site loads |

## Related

- [[architecture/overview]]
- [[glossary]]
