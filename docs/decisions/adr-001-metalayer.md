---
title: "ADR-001: Control Metalayer Pattern"
type: decision
domain: all
status: active
tags:
  - domain/all
  - status/active
  - type/decision
---

# ADR-001: Control Metalayer Pattern

## Status

**Accepted** — scaffolded by symphony-forge

## Context

next-forge needs a governance layer that:
- Defines risk policies for high-impact changes (database migrations, env vars, deploys)
- Provides a canonical command registry for build automation
- Maps the full repository topology for discoverability
- Enables AI agents to operate autonomously with safety guardrails

## Decision

> [!decision]
> We adopt the **control metalayer** pattern: `.control/` YAML for governance, `scripts/harness/` for automation, `docs/` for knowledge, and metalayer-aware agent instructions.

## Rationale

The metalayer is a **control system** applied to development:
- **Policy gates** are sensors that detect high-risk changes
- **Harness scripts** are actuators that enforce standards
- **Knowledge graph** is the system's model of itself
- **Agent instructions** close the loop between measurement and action

## Consequences

### Positive
- Agents can operate autonomously with clear guardrails
- New contributors discover conventions via docs, not tribal knowledge
- Entropy is measurable and auditable

### Negative
- Additional files to maintain (mitigated by audit scripts)
- Learning curve for the metalayer conventions

## Related

- [[architecture/overview]]
- [[glossary]]
