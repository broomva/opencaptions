import { describe, expect, test } from "bun:test";
import type { CWIDocument } from "@opencaptions/types";
import { exportASS } from "./export-ass.js";

describe("exportASS", () => {
	const mockDoc: CWIDocument = {
		$schema: "https://opencaptions.tools/schema/cwi/1.0.json",
		version: "1.0",
		metadata: {
			title: "Test",
			duration: 10,
			language: "en",
			generator: "test",
			created_at: "2026-10-27T00:00:00Z",
			extractor_backend: "av",
		},
		cast: [
			{
				id: "S0",
				name: "Claude",
				color: "#FF5555",
				voice_profile: {
					pitch_baseline_hz: 100,
					pitch_p10: 90,
					pitch_p90: 110,
					volume_baseline_db: -20,
					volume_p10: -30,
					volume_p90: -10,
				},
			},
		],
		captions: [
			{
				id: "c1",
				speaker_id: "S0",
				start: 0,
				end: 5,
				words: [
					{ text: "Hello", start: 0, end: 1, weight: 400, size: 1, emphasis: false },
					{ text: "world!", start: 1, end: 2, weight: 800, size: 1.2, emphasis: true },
					{ text: "whisper", start: 2, end: 3, weight: 200, size: 0.7, emphasis: false },
				],
			},
		],
	};

	test("generates valid ASS headers", () => {
		const ass = exportASS(mockDoc);
		expect(ass).toContain("[Script Info]");
		expect(ass).toContain("PlayResX: 1920");
		expect(ass).toContain("PlayResY: 1080");
		expect(ass).toContain("WrapStyle: 2");
		expect(ass).toContain("[V4+ Styles]");
	});

	test("converts colors and applies overrides properly", () => {
		const ass = exportASS(mockDoc);
		// Inactive defaults to #FFFFFF -> &HFFFFFF&
		// Active color #FF5555 -> &H5555FF&

		// "Hello" word check
		expect(ass).toContain("{\\b400\\fs36\\1c&HFFFFFF&\\t(100,700,\\1c&H5555FF&)}Hello{\\r}");

		// "world!" with emphasis check
		expect(ass).toContain(
			"{\\b800\\fs43\\1c&HFFFFFF&\\t(1100,1700,\\1c&H5555FF&)\\t(1100,1250,\\fscx115\\fscy115)\\t(1250,1550,\\fscx100\\fscy100)}world!{\\r}",
		);

		// "whisper" check (size <= 0.8)
		expect(ass).toContain(
			"{\\b200\\fs25\\1c&HFFFFFF&\\t(2100,2700,\\1c&H5555FF&)\\1a&H60&}whisper{\\r}",
		);
	});

	test("escapes { } and \\ properly", () => {
		const trickyDoc: CWIDocument = {
			...mockDoc,
			captions: [
				{
					...mockDoc.captions[0],
					words: [
						{ text: "Bad{text}\\here\n!", start: 0, end: 1, weight: 400, size: 1, emphasis: false },
					],
				},
			],
		};
		const ass = exportASS(trickyDoc);
		expect(ass).toContain("}Badtexthere !{\\r}");
	});

	test("splits lines based on maxCharsPerLine", () => {
		const longDoc: CWIDocument = {
			...mockDoc,
			captions: [
				{
					...mockDoc.captions[0],
					words: [
						{ text: "1234567890", start: 0, end: 1, weight: 400, size: 1, emphasis: false },
						{ text: "1234567890", start: 1, end: 2, weight: 400, size: 1, emphasis: false },
						{ text: "1234567890", start: 2, end: 3, weight: 400, size: 1, emphasis: false },
						{ text: "1234567890", start: 3, end: 4, weight: 400, size: 1, emphasis: false },
						{ text: "1234567890", start: 4, end: 5, weight: 400, size: 1, emphasis: false },
					],
				},
			],
		};
		const ass = exportASS(longDoc, { maxCharsPerLine: 25 });

		// First dialogue should have line 1 and 2
		// Second dialogue should have line 3
		const matches = [...ass.matchAll(/Dialogue:/g)];
		expect(matches.length).toBe(2);
	});
});

describe("exportASS timing", () => {
	test("rounds times to centiseconds instead of truncating float error", () => {
		const doc = {
			cast: [{ id: "S0", color: "#6B8AFF" }],
			captions: [
				{
					id: "e",
					start: 2.48,
					end: 3.005,
					speaker_id: "S0",
					words: [{ text: "hi", start: 2.48, end: 3.005, weight: 400, size: 1, emphasis: false }],
				},
			],
		} as unknown as CWIDocument;
		const line = exportASS(doc)
			.split("\n")
			.find((l) => l.startsWith("Dialogue"));
		expect(line?.startsWith("Dialogue: 0,0:00:02.48,0:00:03.01,")).toBe(true);
	});
});

describe("exportASS background box", () => {
	const doc = {
		cast: [{ id: "S0", color: "#6B8AFF" }],
		captions: [
			{
				id: "e",
				start: 0,
				end: 1,
				speaker_id: "S0",
				words: [{ text: "hi", start: 0, end: 1, weight: 400, size: 1, emphasis: false }],
			},
		],
	} as unknown as CWIDocument;
	const style = (o: Parameters<typeof exportASS>[1]) =>
		exportASS(doc, o)
			.split("\n")
			.find((l) => l.startsWith("Style:"))
			?.split(",") ?? [];

	test("box uses one padded box per event with no glyph halo", () => {
		const s = style({ backgroundBox: true, baseFontSize: 60 });
		expect(s[15]).toBe("4"); // BorderStyle
		expect(s[16]).toBe("15"); // Outline = padding
		expect(s[5]).toBe("&HFF000000"); // OutlineColour transparent
		expect(s[6]).toBe("&H401A0B05"); // Midnight at 75% opacity
	});

	test("box colour and opacity are configurable", () => {
		const s = style({ backgroundBox: true, boxColor: "#102030", boxOpacity: 0.5 });
		expect(s[6]).toBe("&H80302010");
	});

	test("boxed captions get a bottom margin for the padding unless one is given", () => {
		expect(style({ backgroundBox: true, baseFontSize: 60 })[21]).toBe("15");
		expect(style({ backgroundBox: true, baseFontSize: 60, marginV: 300 })[21]).toBe("300");
		expect(style({})[21]).toBe("0");
	});

	test("no box keeps an outlined style", () => {
		const s = style({});
		expect(s[15]).toBe("1");
		expect(s[5]).toBe("&H00000000");
	});
});
