import { describe, expect, test } from "bun:test";
import { parseJsonOutput } from "./parse-json-output.js";

const ok = (stdout: string) => ({ stdout, stderr: "", exitCode: 0 });
const PAYLOAD = '{"words":[{"text":"hi","start":0,"end":0.4}]}';

describe("parseJsonOutput", () => {
	test("clean JSON parses", () => {
		expect(parseJsonOutput<{ words: unknown[] }>(ok(PAYLOAD), "t").words).toHaveLength(1);
	});

	test("the reported bug: a C-level 'Detected language' line before the payload", () => {
		const r = parseJsonOutput<{ words: unknown[] }>(
			ok(`Detected language: English\n${PAYLOAD}`),
			"t",
		);
		expect(r.words).toHaveLength(1);
	});

	test("a polluting line that itself starts with a bracket is skipped", () => {
		const stdout = `[ctranslate2] [thread 1] [warning] low memory\n${PAYLOAD}\n`;
		expect(parseJsonOutput<{ words: unknown[] }>(ok(stdout), "t").words).toHaveLength(1);
	});

	test("a payload glued to pollution with no newline still parses", () => {
		expect(
			parseJsonOutput<{ words: unknown[] }>(ok(`Detected language: English${PAYLOAD}`), "t").words,
		).toHaveLength(1);
	});

	test("pollution AFTER the payload (libc flushing at exit) is ignored", () => {
		const r = parseJsonOutput<{ words: unknown[] }>(
			ok(`${PAYLOAD}\nDetected language: English\n`),
			"t",
		);
		expect(r.words).toHaveLength(1);
	});

	test("a short JSON-looking line on either side cannot beat the payload", () => {
		for (const stdout of [
			`${PAYLOAD}\n{}`,
			`${PAYLOAD}\n[1]`,
			`[1]\n${PAYLOAD}`,
			`{}\n${PAYLOAD}\n[2]`,
		]) {
			expect(parseJsonOutput<{ words: unknown[] }>(ok(stdout), "t").words).toHaveLength(1);
		}
	});

	test("a top-level array payload parses", () => {
		expect(parseJsonOutput<number[]>(ok("noise\n[1,2,3]"), "t")).toEqual([1, 2, 3]);
	});

	test("no JSON at all still throws, naming the context", () => {
		expect(() =>
			parseJsonOutput(ok("Detected language: English\n"), "Whisper transcription"),
		).toThrow(/Whisper transcription returned invalid JSON/);
	});

	test("a non-zero exit throws with stderr, before any parsing", () => {
		expect(() => parseJsonOutput({ stdout: PAYLOAD, stderr: "boom", exitCode: 1 }, "t")).toThrow(
			/exit 1.*boom/,
		);
	});
});
