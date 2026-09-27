export type SubprocessResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

export function parseJsonOutput<T>(result: SubprocessResult, context: string): T {
	if (result.exitCode !== 0) {
		throw new Error(`${context} failed (exit ${result.exitCode}): ${result.stderr}`);
	}
	// The Python scripts write exactly one single-line JSON payload, but native
	// code can still reach stdout: a line printed BEFORE the payload, or libc
	// flushing its buffer at exit AFTER it. Either side may itself look like
	// JSON ("[1]", "{}"). So: parse the whole stream; failing that, take the
	// LONGEST span that parses, where a span starts at a line beginning with
	// '{' or '[' (or at the first bracket anywhere, for a payload glued to a
	// polluting prefix) and ends at a line end. A short JSON-looking pollution
	// line then cannot beat the payload, on either side.
	const stdout = result.stdout;
	try {
		return JSON.parse(stdout) as T;
	} catch {
		// polluted; search for the payload span
	}
	const starts = new Set<number>();
	for (const m of stdout.matchAll(/^[ \t]*[{[]/gm)) starts.add(m.index ?? 0);
	const firstBracket = stdout.search(/[{[]/);
	if (firstBracket >= 0) starts.add(firstBracket);
	const ends = [...stdout.matchAll(/\n/g)].map((m) => m.index ?? 0);
	ends.push(stdout.length);
	let best: { len: number; value: T } | undefined;
	for (const start of starts) {
		for (const end of ends) {
			const len = end - start;
			if (len <= 0 || (best && len <= best.len)) continue;
			try {
				best = { len, value: JSON.parse(stdout.slice(start, end)) as T };
			} catch {
				// not a complete JSON value
			}
		}
	}
	if (best) return best.value;
	throw new Error(`${context} returned invalid JSON: ${stdout.slice(0, 200)}`);
}
