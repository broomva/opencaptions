import { describe, expect, test } from "bun:test";
import type { RawTranscript } from "@opencaptions/types";
import { alignTranscript, normalizeWord } from "./align.js";

describe("alignTranscript", () => {
	test("normalizeWord works", () => {
		expect(normalizeWord("Hello,")).toBe("hello");
		expect(normalizeWord("world!")).toBe("world");
		expect(normalizeWord("AGENTS.md")).toBe("agentsmd");
	});

	const mockTranscript: RawTranscript = {
		words: [
			{ text: "helo", start: 0, end: 1, confidence: 0.9 },
			{ text: "cloud", start: 1, end: 2, confidence: 0.8 },
			{ text: "uh", start: 2, end: 3, confidence: 0.5 },
			{ text: "world", start: 3, end: 4, confidence: 0.9 },
		],
		language: "en",
		duration: 5,
		source_backend: "test",
	};

	test("handles substitutions and insertions/deletions", () => {
		const refText = "Hello, Claude! Welcome world.";
		const aligned = alignTranscript(mockTranscript, refText);

		expect(aligned.words.length).toBe(4);

		expect(aligned.words[0].text).toBe("Hello,");
		expect(aligned.words[0].start).toBe(0);

		expect(aligned.words[1].text).toBe("Claude!");
		expect(aligned.words[1].start).toBe(1);

		expect(aligned.words[2].text).toBe("Welcome");
		expect(aligned.words[2].start).toBe(2);

		expect(aligned.words[3].text).toBe("world.");
		expect(aligned.words[3].start).toBe(3);
	});

	test("handles interpolations for deleted words", () => {
		const mockMissing: RawTranscript = {
			words: [
				{ text: "hello", start: 0, end: 1, confidence: 0.9 },
				{ text: "claude", start: 3, end: 4, confidence: 0.9 },
			],
			language: "en",
			duration: 5,
			source_backend: "test",
		};
		const refText = "Hello missing word claude";
		const aligned = alignTranscript(mockMissing, refText);

		expect(aligned.words.length).toBe(4);
		expect(aligned.words[0].text).toBe("Hello");
		expect(aligned.words[3].text).toBe("claude");

		expect(aligned.words[1].text).toBe("missing");
		expect(aligned.words[1].start).toBeGreaterThanOrEqual(1);
		expect(aligned.words[1].start).toBeLessThan(3);

		expect(aligned.words[2].text).toBe("word");
		expect(aligned.words[2].start).toBeGreaterThan(aligned.words[1].start);
		expect(aligned.words[2].start).toBeLessThan(3);
	});
});

describe("alignTranscript bounds", () => {
	test("drops reference tokens past the end of the audio instead of collapsing them", () => {
		const t = {
			words: [
				{ text: "the", start: 0, end: 0.2, confidence: 1 },
				{ text: "workspace", start: 0.2, end: 0.6, confidence: 1 },
			],
			language: "en",
			duration: 0.6,
		};
		const out = alignTranscript(t as never, "The workspace is the product.");
		expect(out.words.map((w) => w.text)).toEqual(["The", "workspace"]);
	});

	test("spreads interior missing tokens over the gap with positive widths", () => {
		const t = {
			words: [
				{ text: "a", start: 0, end: 0.2, confidence: 1 },
				{ text: "d", start: 1.0, end: 1.2, confidence: 1 },
			],
			language: "en",
			duration: 1.2,
		};
		const out = alignTranscript(t as never, "a b c d");
		expect(out.words.map((w) => w.text)).toEqual(["a", "b", "c", "d"]);
		for (const w of out.words) expect(w.end).toBeGreaterThan(w.start);
		expect(out.words[1].start).toBeCloseTo(0.2);
		expect(out.words[2].end).toBeCloseTo(1.0);
	});
});
