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

## Attribution
One of the three CWI pillars. Identifies WHO is speaking via color-coded speaker assignment. Each speaker gets a unique color from a 12-color WCAG AA palette.

## Control Metalayer
The governance layer (`.control/`) that defines policies, commands, and topology for the project. Acts as a declarative control system for development practices.

## CWI (Caption with Intention)
The Oscar-winning (2025) captioning standard by FCB Chicago + Chicago Hearing Society. Encodes cinematic intent — pitch, volume, emotion, emphasis, sarcasm, pacing — as visual language in captions using color, variable font weight/size, and word-level timing.

## Entropy Audit
A check that measures "drift" in the repository: uncovered topology, stale docs, broken wikilinks. Run via `make -f Makefile.control audit`.

## Harness
The collection of bash scripts in `scripts/harness/` that automate common development tasks (check, test, build, audit).

## IntentFrame
The core data structure representing extracted cinematic intent for a single word or phrase. Contains pitch, volume, emotion, emphasis, speaking rate, and mapped CWI styling parameters (color, font weight, font size, timing offset).

## Intonation
One of the three CWI pillars. Conveys HOW something is said via variable-font styling. Font weight maps to pitch, font size maps to volume, and emphasis triggers a 15% size bounce animation.

## Knowledge Graph
The interconnected documentation in `docs/` using Obsidian-flavored Markdown with wikilinks (`[[target]]`) and frontmatter tags.

## LearnedMapper
V2 IntentMapper trained on correction data collected via the tracing flywheel. Adapts CWI styling based on real-world reviewer feedback. Phase 3.

## MapperCorrection
A tracing record capturing a human reviewer's adjustment to mapper output. Contains the original IntentFrame, the corrected styling values, and reviewer metadata. Accumulated corrections form the training set for LearnedMapper V2.

## NeuralMapper
V3 IntentMapper that maps brain ROI activations (from TRIBE v2) directly to CWI styling. Produces captions that represent what the viewer's brain WOULD FEEL. Phase 3.5.

## PipelineTrace
A complete execution trace for a single pipeline run. Contains input metadata, all intermediate IntentFrames, validation results, timing, and optional MapperCorrections. Used for debugging, telemetry, and training data collection.

## Policy Gate
A rule in `.control/policy.yaml` that identifies high-risk changes and their required checks before proceeding.

## Roboto Flex
The variable font used for CWI caption rendering. Weight axis maps to pitch (lighter = lower, bolder = higher). Size axis maps to volume. Supports the full range of CWI intonation expression.

## RulesMapper
V1 IntentMapper using pure math (lerp interpolation) to convert extracted audio/visual features into CWI styling parameters. Deterministic, requires zero training data. Ships as the default mapper.

## Synchronization
One of the three CWI pillars. Controls WHEN each word appears via word-level timing. Words transition from white to speaker color using an ease curve (100ms delay, 600ms duration) synchronized to speech timing.

## Topology
The map of all apps and packages in `.control/topology.yaml`, including their paths, dependencies, risk levels, and domains.

## TRIBE v2
Meta's TRansformer for In-silico Brain Experiments. Predicts fMRI brain activations from stimuli. Used by NeuralMapper V3 to ground CWI styling in actual neural responses.

## V-JEPA2
Meta's Video Joint Embedding Predictive Architecture v2. A world model that understands video semantics without relying on text. Used by backend-jepa (Phase 3) as an intent extraction backend.

## Wikilink
An Obsidian-style internal link: `[[path/to/doc]]` resolves to `docs/path/to/doc.md`.
