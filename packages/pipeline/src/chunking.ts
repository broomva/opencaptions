import type { CWIWord, CaptionEvent } from "@opencaptions/types";

const PUNCTUATION = /[.,;:?!]$/;
const CONJUNCTIONS = new Set([
	"and",
	"or",
	"but",
	"so",
	"for",
	"yet",
	"nor",
	"because",
	"although",
]);

function getTextLength(words: CWIWord[]): number {
	return words.map((w) => w.text).join(" ").length;
}

export function applyEmphasisCap(words: CWIWord[]) {
	const emphasized = words.filter((w) => w.emphasis);
	const maxEmphasis = Math.max(1, Math.round(words.length / 6));
	if (emphasized.length > maxEmphasis) {
		emphasized.sort((a, b) => b.size - a.size || b.weight - a.weight);
		const keep = new Set(emphasized.slice(0, maxEmphasis));
		for (const w of words) {
			if (w.emphasis && !keep.has(w)) {
				w.emphasis = false;
			}
		}
	}
}

export function chunkCaptionEvent(event: CaptionEvent, maxChars = 42): CaptionEvent[] {
	if (getTextLength(event.words) <= maxChars) {
		return [event];
	}

	const chunks: CaptionEvent[] = [];
	let startIdx = 0;

	while (startIdx < event.words.length) {
		let endIdx = startIdx + 1;
		let bestSplit = -1;
		let bestScore = -1;

		let currentLen = event.words[startIdx].text.length;
		let lastValidEnd = endIdx;

		while (endIdx < event.words.length) {
			const nextWord = event.words[endIdx];
			const addedLen = 1 + nextWord.text.length; // +1 for space
			if (currentLen + addedLen > maxChars) {
				break;
			}
			currentLen += addedLen;
			endIdx++;
			lastValidEnd = endIdx;
		}

		if (lastValidEnd === event.words.length) {
			bestSplit = lastValidEnd;
		} else {
			for (let i = startIdx + 1; i <= lastValidEnd; i++) {
				let score = i - startIdx;
				const prevWord = event.words[i - 1];
				const nextWord = i < event.words.length ? event.words[i] : null;

				if (PUNCTUATION.test(prevWord.text)) {
					score += 10;
				}
				if (nextWord && CONJUNCTIONS.has(nextWord.text.toLowerCase())) {
					score += 5;
				}
				if (i === event.words.length - 1) {
					score -= 100;
				}

				if (score > bestScore) {
					bestScore = score;
					bestSplit = i;
				}
			}

			if (bestSplit === -1) {
				bestSplit = lastValidEnd;
			}
		}

		if (bestSplit === startIdx) {
			bestSplit = startIdx + 1;
		}

		const chunkWords = event.words.slice(startIdx, bestSplit);
		chunks.push({
			id: crypto.randomUUID(),
			speaker_id: event.speaker_id,
			start: chunkWords[0].start,
			end: chunkWords[chunkWords.length - 1].end,
			words: chunkWords,
		});

		startIdx = bestSplit;
	}

	for (let i = 0; i < chunks.length - 1; i++) {
		if (chunks[i].end > chunks[i + 1].start) {
			chunks[i].end = chunks[i + 1].start;
		}
	}

	return chunks;
}
