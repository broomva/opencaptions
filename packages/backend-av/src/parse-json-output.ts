export type SubprocessResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

export function parseJsonOutput<T>(result: SubprocessResult, context: string): T {
	if (result.exitCode !== 0) {
		throw new Error(`${context} failed (exit ${result.exitCode}): ${result.stderr}`);
	}
	// Some Python libraries (notably faster-whisper / ctranslate2) emit
	// C-level prints to stdout that bypass Python's sys.stdout and resist
	// redirect_stdout(). Parse the whole stream first; if that fails, try each
	// line that starts with '{' or '[' and parse from there to the end. A
	// polluting line may itself contain brackets (e.g. "[ctranslate2] [warning]"),
	// so the first bracket in the stream is not necessarily the payload.
	const stdout = result.stdout;
	const candidates = [0];
	for (const m of stdout.matchAll(/^[ \t]*[{[]/gm)) candidates.push(m.index ?? 0);
	// Last resort: the first bracket anywhere, for a payload glued to a
	// polluting line with no newline in between.
	const firstBracket = stdout.search(/[{[]/);
	if (firstBracket >= 0) candidates.push(firstBracket);
	for (const start of candidates) {
		try {
			return JSON.parse(stdout.slice(start)) as T;
		} catch {
			// not the payload; try the next line
		}
	}
	throw new Error(`${context} returned invalid JSON: ${stdout.slice(0, 200)}`);
}
