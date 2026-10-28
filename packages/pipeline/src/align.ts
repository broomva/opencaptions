import type { RawTranscript, RawWord } from "@opencaptions/types";

export function normalizeWord(word: string): string {
    return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function alignTranscript(transcript: RawTranscript, referenceText: string): RawTranscript {
    const refTokens = referenceText.trim().split(/\s+/).filter(t => t.length > 0);
    if (refTokens.length === 0) return transcript;

    const hypWords = transcript.words;
    
    // DP matrix
    const n = refTokens.length;
    const m = hypWords.length;
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    const ptr: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0)); // 1: diag, 2: top (del), 3: left (ins)
    
    for (let i = 1; i <= n; i++) {
        dp[i][0] = -i;
        ptr[i][0] = 2;
    }
    for (let j = 1; j <= m; j++) {
        dp[0][j] = -j;
        ptr[0][j] = 3;
    }
    
    for (let i = 1; i <= n; i++) {
        const refNorm = normalizeWord(refTokens[i - 1]);
        for (let j = 1; j <= m; j++) {
            const hypNorm = normalizeWord(hypWords[j - 1].text);
            const isMatch = refNorm === hypNorm;
            
            const matchScore = dp[i - 1][j - 1] + (isMatch ? 2 : -1); // Match: +2, Sub: -1
            const delScore = dp[i - 1][j] - 1;
            const insScore = dp[i][j - 1] - 1;
            
            let maxScore = matchScore;
            let p = 1;
            
            if (delScore > maxScore) { maxScore = delScore; p = 2; }
            if (insScore > maxScore) { maxScore = insScore; p = 3; }
            
            dp[i][j] = maxScore;
            ptr[i][j] = p;
        }
    }
    
    // Backtrack
    const alignedWords: Array<{ type: 'match' | 'sub' | 'del', refIdx: number, hypIdx?: number }> = [];
    let i = n;
    let j = m;
    while (i > 0 || j > 0) {
        if (ptr[i][j] === 1) {
            const isMatch = normalizeWord(refTokens[i - 1]) === normalizeWord(hypWords[j - 1].text);
            alignedWords.unshift({ type: isMatch ? 'match' : 'sub', refIdx: i - 1, hypIdx: j - 1 });
            i--; j--;
        } else if (ptr[i][j] === 2) {
            alignedWords.unshift({ type: 'del', refIdx: i - 1 });
            i--;
        } else {
            // insertion (extra whisper token), dropped.
            j--;
        }
    }
    
    // Build new transcript words
    const newWords: RawWord[] = [];
    
    // Pass 1: Fill timings for matches/subs
    for (const item of alignedWords) {
        if (item.hypIdx !== undefined) {
            const hyp = hypWords[item.hypIdx];
            newWords.push({
                text: refTokens[item.refIdx],
                start: hyp.start,
                end: hyp.end,
                confidence: hyp.confidence
            });
        } else {
            newWords.push({
                text: refTokens[item.refIdx],
                start: -1, // placeholder
                end: -1,
                confidence: 0
            });
        }
    }
    
    // Pass 2: Interpolate missing timings (del)
    for (let k = 0; k < newWords.length; k++) {
        if (newWords[k].start === -1) {
            // Find prev known
            let prevEnd = 0;
            for (let p = k - 1; p >= 0; p--) {
                if (newWords[p].end !== -1) { prevEnd = newWords[p].end; break; }
            }
            // Find next known
            let nextStart = transcript.duration; // Default to total duration
            for (let p = k + 1; p < newWords.length; p++) {
                if (newWords[p].start !== -1) { nextStart = newWords[p].start; break; }
            }
            
            // Just use midpoint for this missing word
            // Note: If multiple are missing in a row, we should distribute them evenly, 
            // but for simplicity we can just assign the same interpolated point or spread them.
            // Let's count how many are missing in this block
            let missingCount = 0;
            for (let p = k; p < newWords.length; p++) {
                if (newWords[p].start === -1) missingCount++;
                else break;
            }
            
            const step = (nextStart - prevEnd) / (missingCount + 1);
            for (let stepIdx = 0; stepIdx < missingCount; stepIdx++) {
                const t = prevEnd + step * (stepIdx + 1);
                newWords[k + stepIdx].start = t;
                newWords[k + stepIdx].end = t + step * 0.9; // give it some width
            }
            k += missingCount - 1; // skip the ones we just filled
        }
    }
    
    return {
        ...transcript,
        words: newWords
    };
}
