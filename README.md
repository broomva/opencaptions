# OpenCaptions

> Feel the film. Render the intent.

Open-source video understanding pipeline that generates [Caption with Intention (CWI)](https://www.captionwithintention.org/) compliant captions by extracting cinematic intent from video.

## What is this?

Caption with Intention won an Oscar (2025) and two Cannes Lions Grand Prix. It transforms flat, static captions into expressive visual storytelling through:

- **Attribution** — color-coded speaker identification
- **Synchronization** — word-by-word animation synced to speech
- **Intonation** — variable font weight and size conveying pitch, volume, and emotion

OpenCaptions is the first programmatic toolchain for CWI. Point it at a video, and it extracts intent — pitch, volume, emotion, emphasis, sarcasm, pacing — then renders that felt experience as CWI visual language.

## Quick Start

```bash
npx opencaptions generate film.mp4 --output film.cwi.json
```

## Packages

| Package | Description |
|---------|-------------|
| `@opencaptions/types` | Core TypeScript types + JSON Schema |
| `@opencaptions/spec` | CWI validation rules engine |
| `@opencaptions/layout` | Pretext + Yoga word geometry |
| `@opencaptions/pipeline` | Orchestrator + backend interfaces |
| `@opencaptions/backend-av` | V1: Whisper + pyannote + audio analysis |
| `@opencaptions/renderer` | Canvas/DOM/Terminal renderer |
| `@opencaptions/tracing` | Opt-in anonymous telemetry |
| `opencaptions` | Bun CLI |

## License

MIT
