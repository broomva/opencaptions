---
title: "Glossary"
type: glossary
domain: all
status: active
tags:
  - domain/all
  - status/active
  - type/glossary
---

# Glossary

## Control Metalayer
The governance layer (`.control/`) that defines policies, commands, and topology for the project. Acts as a declarative control system for development practices.

## Entropy Audit
A check that measures "drift" in the repository: uncovered topology, stale docs, broken wikilinks. Run via `make -f Makefile.control audit`.

## Harness
The collection of bash scripts in `scripts/harness/` that automate common development tasks (check, test, build, audit).

## Knowledge Graph
The interconnected documentation in `docs/` using Obsidian-flavored Markdown with wikilinks (`[[target]]`) and frontmatter tags.

## Policy Gate
A rule in `.control/policy.yaml` that identifies high-risk changes and their required checks before proceeding.

## Topology
The map of all apps and packages in `.control/topology.yaml`, including their paths, dependencies, risk levels, and domains.

## Wikilink
An Obsidian-style internal link: `[[path/to/doc]]` resolves to `docs/path/to/doc.md`.
