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
