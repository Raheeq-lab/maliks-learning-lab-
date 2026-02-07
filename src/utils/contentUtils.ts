/**
 * Utility to strip redundant labels from lesson content strings.
 * Removes prefixes like "Scaffolded Question 1:", "Worked Example:", "Instructional Breakdown:", etc.
 */
export const stripLabels = (text: string | any): any => {
    if (typeof text !== 'string') return text;

    // List of patterns to strip (case-insensitive)
    const patterns = [
        /^scaffolded question \d+:\s*/i,
        /^scaffolded question:\s*/i,
        /^instructional breakdown:\s*/i,
        /^worked example:\s*/i,
        /^3-2-1 exit ticket:\s*/i,
        /^exit ticket:\s*/i,
        /^level \d+:\s*/i,
        /^context & history:\s*/i,
        /^key vocabulary:\s*/i,
        /^step \d+:\s*/i,
        /^\d+\.\s*/, // Strips leading "1. " etc.
        /^-\s*/      // Strips leading "- "
    ];

    let cleaned = text.trim();
    let changed = true;

    // Keep stripping until no more matches (handles multiple prefixes)
    while (changed) {
        changed = false;
        for (const pattern of patterns) {
            const newCleaned = cleaned.replace(pattern, '');
            if (newCleaned !== cleaned) {
                cleaned = newCleaned.trim();
                changed = true;
            }
        }
    }

    return cleaned;
};
