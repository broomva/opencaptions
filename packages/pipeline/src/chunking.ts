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

/** Words that carry grammar, not stress: never emphasised, never the last word of a caption. */
export const FUNCTION_WORDS = new Set([
	"a",
	"an",
	"the",
	"of",
	"to",
	"in",
	"on",
	"at",
	"by",
	"for",
	"with",
	"from",
	"as",
	"into",
	"and",
	"or",
	"but",
	"so",
	"nor",
	"if",
	"that",
	"than",
	"it",
	"its",
	"is",
	"are",
	"was",
	"be",
	"can",
	"will",
	"has",
	"have",
	"this",
	"these",
	"those",
	"each",
	"every",
	"what",
]);
export const bare = (text: string) => text.toLowerCase().replace(/[^a-z']/g, "");

function getTextLength(words: CWIWord[]): number {
	return words.map((w) => w.text).join(" ").length;
}

export function applyEmphasisCap(words: CWIWord[]) {
	// function words carry grammar, not stress: never emphasised, and never visually dominant
	// (a pitch rise on "an" would otherwise render it at weight 800, louder than the content words)
	for (const w of words) {
		if (!FUNCTION_WORDS.has(bare(w.text))) continue;
		w.emphasis = false;
		w.weight = Math.min(w.weight, 500);
		w.size = Math.min(w.size, 1.05);
	}
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
				const prevWord = event.words[i - 1];
				const nextWord = i < event.words.length ? event.words[i] : null;
				// fill dominates: a caption should use its line, not break at every comma
				const fill = getTextLength(event.words.slice(startIdx, i)) / maxChars;
				let score = fill * 10;

				// a sentence end is a strong break even on a short line; a comma only once the line is well used
				if (/[.?!]$/.test(prevWord.text) && fill >= 0.3) {
					score += 8;
				} else if (PUNCTUATION.test(prevWord.text) && fill >= 0.6) {
					score += 4;
				}
				if (nextWord && CONJUNCTIONS.has(nextWord.text.toLowerCase()) && fill >= 0.6) {
					score += 2;
				}
				if (FUNCTION_WORDS.has(bare(prevWord.text))) {
					score -= 20; // "…somewhere to | put files" reads as a broken thought
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
