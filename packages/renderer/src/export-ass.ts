import { type CWIDocument, type CWIWord, type CaptionEvent, Speaker } from "@opencaptions/types";

export type AssOptions = {
	width?: number;
	height?: number;
	fontFamily?: string;
	baseFontSize?: number;
	marginL?: number;
	marginR?: number;
	marginV?: number;
	alignment?: number;
	maxCharsPerLine?: number;
	inactiveColor?: string;
	backgroundBox?: boolean;
	outline?: number;
	shadow?: number;
};

function formatAssTime(seconds: number): string {
	const total = Math.max(0, Math.round(seconds * 100));
	const cs = total % 100;
	const s = Math.floor(total / 100) % 60;
	const m = Math.floor(total / 6000) % 60;
	const h = Math.floor(total / 360000);
	return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function hexToAssColor(hex: string): string {
	const clean = hex.replace(/^#/, "");
	if (clean.length === 6) {
		const r = clean.substring(0, 2);
		const g = clean.substring(2, 4);
		const b = clean.substring(4, 6);
		return `&H${b}${g}${r}&`;
	}
	return "&HFFFFFF&";
}

function escapeAssText(text: string): string {
	return text.replace(/[{}]/g, "").replace(/\\/g, "").replace(/\n/g, " ");
}

type DialogueLine = { words: CWIWord[] };
type Dialogue = {
	start: number;
	end: number;
	speakerId: string;
	lines: DialogueLine[];
};

function splitEventIntoDialogues(event: CaptionEvent, maxChars: number): Dialogue[] {
	const dialogues: Dialogue[] = [];
	let currentDialogue: Dialogue = {
		start: event.start,
		end: event.end,
		speakerId: event.speaker_id,
		lines: [{ words: [] }],
	};

	let currentLineChars = 0;

	for (const word of event.words) {
		if (
			currentLineChars + word.text.length > maxChars &&
			currentDialogue.lines[currentDialogue.lines.length - 1].words.length > 0
		) {
			if (currentDialogue.lines.length >= 2) {
				const lastLine = currentDialogue.lines[currentDialogue.lines.length - 1];
				const lastWord = lastLine.words[lastLine.words.length - 1];
				currentDialogue.end = lastWord.end;
				dialogues.push(currentDialogue);

				currentDialogue = {
					start: word.start,
					end: event.end,
					speakerId: event.speaker_id,
					lines: [{ words: [] }],
				};
			} else {
				currentDialogue.lines.push({ words: [] });
			}
			currentLineChars = 0;
		}

		currentDialogue.lines[currentDialogue.lines.length - 1].words.push(word);
		currentLineChars += word.text.length + 1;
	}

	if (currentDialogue.lines[0].words.length > 0) {
		const lastLine = currentDialogue.lines[currentDialogue.lines.length - 1];
		const lastWord = lastLine.words[lastLine.words.length - 1];
		currentDialogue.end = Math.max(currentDialogue.end, lastWord.end);
		dialogues.push(currentDialogue);
	}

	return dialogues;
}

export function exportASS(doc: CWIDocument, opts: AssOptions = {}): string {
	const width = opts.width ?? 1920;
	const height = opts.height ?? 1080;
	const fontFamily = opts.fontFamily ?? "Roboto Flex";
	const baseFontSize = opts.baseFontSize ?? Math.round(height * 0.033);
	const marginL = opts.marginL ?? 0;
	const marginR = opts.marginR ?? 0;
	const marginV = opts.marginV ?? 0;
	const alignment = opts.alignment ?? 2;
	const maxCharsPerLine = opts.maxCharsPerLine ?? 32;
	const inactiveColor = hexToAssColor(opts.inactiveColor ?? "#FFFFFF");
	const backgroundBox = opts.backgroundBox ?? false;

	const borderStyle = backgroundBox ? 3 : 1;
	const outline = opts.outline ?? (backgroundBox ? 0 : 2);
	const shadow = opts.shadow ?? (backgroundBox ? 0 : 1);

	const lines: string[] = [];
	lines.push("[Script Info]");
	lines.push("ScriptType: v4.00+");
	lines.push(`PlayResX: ${width}`);
	lines.push(`PlayResY: ${height}`);
	lines.push("ScaledBorderAndShadow: yes");
	lines.push("WrapStyle: 2");
	lines.push("");
	lines.push("[V4+ Styles]");
	lines.push(
		"Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
	);
	lines.push(
		`Style: Default,${fontFamily},${baseFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,${borderStyle},${outline},${shadow},${alignment},${marginL},${marginR},${marginV},1`,
	);
	lines.push("");
	lines.push("[Events]");
	lines.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");

	for (const event of doc.captions) {
		const speaker = doc.cast.find((s) => s.id === event.speaker_id);
		const speakerColorHex = speaker ? speaker.color : "#FFFFFF";
		const activeColor = hexToAssColor(speakerColorHex);

		const dialogues = splitEventIntoDialogues(event, maxCharsPerLine);
		for (const dialogue of dialogues) {
			const dialogueLines = dialogue.lines.map((line) => {
				return line.words
					.map((word) => {
						const delay = word.animation?.delay_ms ?? 100;
						const duration = word.animation?.duration_ms ?? 600;
						const t1 = Math.round((word.start - dialogue.start) * 1000) + delay;
						const t2 = t1 + duration;

						const weight = Math.round(word.weight / 100) * 100;
						const fontSize = Math.round(baseFontSize * word.size);

						let tags = `{\\b${weight}\\fs${fontSize}`;
						tags += `\\1c${inactiveColor}\\t(${t1},${t2},\\1c${activeColor})`;

						if (word.emphasis) {
							const bounceDur = 150;
							tags += `\\t(${t1},${t1 + bounceDur},\\fscx115\\fscy115)\\t(${t1 + bounceDur},${t1 + 450},\\fscx100\\fscy100)`;
						}
						if (word.size <= 0.8) {
							tags += "\\alpha&H60&";
						}
						tags += "}";
						const resetTags = "{\\r}";

						return `${tags}${escapeAssText(word.text)}${resetTags}`;
					})
					.join(" ");
			});

			const text = dialogueLines.join("\\N");
			const startStr = formatAssTime(dialogue.start);
			const endStr = formatAssTime(dialogue.end);

			lines.push(`Dialogue: 0,${startStr},${endStr},Default,${dialogue.speakerId},0,0,0,,${text}`);
		}
	}

	return `${lines.join("\n")}\n`;
}
