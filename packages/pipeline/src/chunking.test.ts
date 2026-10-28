import { describe, expect, it } from "bun:test";
import type { CWIWord, CaptionEvent } from "@opencaptions/types";
import { applyEmphasisCap, chunkCaptionEvent } from "./chunking.js";

describe("chunking and emphasis capping", () => {
	it("should cap emphasis to at most ~1 in 6 words", () => {
		const words: CWIWord[] = Array.from({ length: 12 }, (_, i) => ({
			text: `word${i}`,
			start: i,
			end: i + 1,
			weight: 400,
			size: 1.0,
			emphasis: true, // all emphasized
		}));

		applyEmphasisCap(words);
		const numEmphasized = words.filter((w) => w.emphasis).length;
		expect(numEmphasized).toBe(2); // 12 / 6 = 2
	});

	it("should prefer punctuation for splitting", () => {
		const words: CWIWord[] = [
			{ text: "This", start: 0, end: 1, weight: 400, size: 1, emphasis: false },
			{ text: "is", start: 1, end: 2, weight: 400, size: 1, emphasis: false },
			{ text: "a", start: 2, end: 3, weight: 400, size: 1, emphasis: false },
			{ text: "sentence.", start: 3, end: 4, weight: 400, size: 1, emphasis: false },
			{ text: "And", start: 4, end: 5, weight: 400, size: 1, emphasis: false },
			{ text: "this", start: 5, end: 6, weight: 400, size: 1, emphasis: false },
			{ text: "is", start: 6, end: 7, weight: 400, size: 1, emphasis: false },
			{ text: "another", start: 7, end: 8, weight: 400, size: 1, emphasis: false },
			{ text: "long", start: 8, end: 9, weight: 400, size: 1, emphasis: false },
			{ text: "sentence.", start: 9, end: 10, weight: 400, size: 1, emphasis: false },
		];
		// Length of all is 59 chars. Max chars = 42. Should split at "sentence."
		const event: CaptionEvent = {
			id: "evt",
			speaker_id: "S0",
			start: 0,
			end: 10,
			words,
		};

		const chunks = chunkCaptionEvent(event, 42);
		expect(chunks.length).toBeGreaterThan(1);
		expect(chunks[0].words[chunks[0].words.length - 1].text).toBe("sentence.");

		// Every word preserved in order
		const outWords = chunks.flatMap((c) => c.words);
		expect(outWords.map((w) => w.text)).toEqual(words.map((w) => w.text));

		// No overlaps
		for (let i = 0; i < chunks.length - 1; i++) {
			expect(chunks[i].end).toBeLessThanOrEqual(chunks[i + 1].start);
		}
	});

	it("should not leave a 1-word tail if avoidable", () => {
		const words: CWIWord[] = Array.from({ length: 8 }, (_, i) => ({
			text: "longword",
			start: i,
			end: i + 1,
			weight: 400,
			size: 1.0,
			emphasis: false,
		}));
		// 8 * 8 = 64 + 7 spaces = 71 chars
		// Max chars = 42
		// Best split to avoid 1-word tail?
		const event: CaptionEvent = {
			id: "evt",
			speaker_id: "S0",
			start: 0,
			end: 8,
			words,
		};

		const chunks = chunkCaptionEvent(event, 42);
		expect(chunks[chunks.length - 1].words.length).toBeGreaterThan(1);
	});
});

const sentence = (text: string): CaptionEvent => ({
	id: "e",
	speaker_id: "S0",
	start: 0,
	end: 10,
	words: text.split(" ").map((t, i) => ({
		text: t,
		start: i * 0.3,
		end: i * 0.3 + 0.25,
		weight: 400,
		size: 1,
		emphasis: false,
	})),
});
const lines = (evs: CaptionEvent[]) => evs.map((e) => e.words.map((w) => w.text).join(" "));

describe("caption chunking reads like a captioner wrote it", () => {
	it("never ends a caption on a function word", () => {
		const out = lines(
			chunkCaptionEvent(
				sentence(
					"A task folder gives an agent somewhere to put files and then some more words here",
				),
			),
		);
		for (const l of out.slice(0, -1))
			expect(["to", "an", "a", "the", "and"]).not.toContain(l.split(" ").at(-1));
	});

	it("does not split a short comma list into one-word captions", () => {
		const out = lines(
			chunkCaptionEvent(
				sentence(
					"An agentic workspace adds the instructions, policy, skills, memory, and record that survive the task.",
				),
			),
		);
		for (const l of out) expect(l.split(" ").length).toBeGreaterThan(1);
		for (const l of out) expect(l.length).toBeLessThanOrEqual(42);
	});

	it("drops emphasis from function words even when they are the loudest", () => {
		const ws = sentence("The agentic workspace keeps every record").words;
		ws[0].emphasis = true;
		ws[0].size = 1.35; // sentence-initial "The" is the loudest word
		applyEmphasisCap(ws);
		expect(ws[0].emphasis).toBe(false);
	});
});
