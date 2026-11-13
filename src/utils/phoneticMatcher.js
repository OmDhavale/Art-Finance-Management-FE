/**
 * Normalizes English representations of Indian names to a phonetic base string.
 * This handles common alternate spellings:
 * - sh/s, dh/d, bh/b, gh/g, kh/k, ph/f, th/t
 * - ee/i, oo/u, aa/a, y/i
 * It also strips non-alphabetic characters and deduplicates consecutive characters.
 */
export function normalizePhonetic(str) {
    if (!str) return '';
    let s = str.toLowerCase();

    // Replace common transliterated representations
    s = s.replace(/sh/g, 's')
        .replace(/dh/g, 'd')
        .replace(/bh/g, 'b')
        .replace(/gh/g, 'g')
        .replace(/kh/g, 'k')
        .replace(/ph/g, 'f')
        .replace(/th/g, 't')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/aa/g, 'a')
        .replace(/y/g, 'i');

    // Strip non-alphabetic characters
    s = s.replace(/[^a-z]/g, '');

    // Deduplicate side-by-side duplicate characters (e.g. "baal" -> "bal")
    let result = '';
    let prevChar = '';
    for (let char of s) {
        if (char !== prevChar) {
            result += char;
            prevChar = char;
        }
    }
    return result;
}

/**
 * Computes standard Levenshtein distance between two strings.
 */
export function levenshteinDistance(s1, s2) {
    if (!s1) return s2 ? s2.length : 0;
    if (!s2) return s1.length;

    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
        track[j][0] = j;
    }

    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    return track[s2.length][s1.length];
}

/**
 * Computes a similarity score between 0.0 and 1.0.
 * A score of 1.0 means the phonetic signatures are identical.
 */
export function getSimilarity(s1, s2) {
    const n1 = normalizePhonetic(s1);
    const n2 = normalizePhonetic(s2);

    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 0;

    const dist = levenshteinDistance(n1, n2);
    return (maxLen - dist) / maxLen;
}

/**
 * Token Sort Similarity:
 * Splits both strings into tokens, normalizes/cleans them, sorts them alphabetically,
 * and then computes the similarity of the sorted strings.
 */
export function tokenSortSimilarity(s1, s2) {
    const cleanAndSort = (str) => {
        if (!str) return '';
        const tokens = str.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
        tokens.sort();
        return tokens.join(' ');
    };

    const sorted1 = cleanAndSort(s1);
    const sorted2 = cleanAndSort(s2);

    if (!sorted1 || !sorted2) return 0;
    return getSimilarity(sorted1, sorted2);
}

/**
 * Token Set Similarity:
 * Splits strings into tokens, finds the intersection and differences,
 * and computes similarity on sorted combinations of intersection and remainders.
 */
export function tokenSetSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;

    const getTokens = (str) => {
        return new Set(
            str.toLowerCase()
                .split(/[^a-z0-9]+/i)
                .filter(Boolean)
                .map(t => normalizePhonetic(t))
                .filter(Boolean)
        );
    };

    const tokens1 = getTokens(s1);
    const tokens2 = getTokens(s2);

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const diff1to2 = new Set([...tokens1].filter(x => !tokens2.has(x)));
    const diff2to1 = new Set([...tokens2].filter(x => !tokens1.has(x)));

    const sortedIntersection = [...intersection].sort().join(' ');
    const sortedDiff1 = [...diff1to2].sort().join(' ');
    const sortedDiff2 = [...diff2to1].sort().join(' ');

    const t0 = sortedIntersection;
    const t1 = sortedIntersection + (sortedDiff1 ? ' ' + sortedDiff1 : '');
    const t2 = sortedIntersection + (sortedDiff2 ? ' ' + sortedDiff2 : '');

    const r0 = getSimilarity(t0, t1);
    const r1 = getSimilarity(t0, t2);
    const r2 = getSimilarity(t1, t2);

    return Math.max(r0, r1, r2);
}

/**
 * Checks if all words/tokens in the query string are present (or phonetically similar)
 * in the target string, regardless of order.
 */
export function fuzzySearchMatch(query, target, threshold = 0.75) {
    if (!query) return true;
    if (!target) return false;

    // Split query into alphanumeric tokens
    const queryTokens = query.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
    if (queryTokens.length === 0) return true;

    // Split target into alphanumeric tokens
    const targetTokens = target.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
    if (targetTokens.length === 0) return false;

    // Normalize target tokens phonetically
    const normalizedTargets = targetTokens.map(t => normalizePhonetic(t)).filter(Boolean);

    // Every token in the query must match at least one token in the target
    return queryTokens.every(qToken => {
        const qNorm = normalizePhonetic(qToken);
        if (!qNorm) return true; // skip empty tokens

        // Check if there is any target token that is a close match
        return normalizedTargets.some(tNorm => {
            // Perfect match or substring match
            if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) return true;

            // Otherwise check phonetic similarity (Levenshtein)
            const maxLen = Math.max(qNorm.length, tNorm.length);
            if (maxLen === 0) return false;
            const dist = levenshteinDistance(qNorm, tNorm);
            const sim = (maxLen - dist) / maxLen;
            return sim >= threshold;
        });
    });
}

