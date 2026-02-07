/**
 * Utility to strip redundant labels from lesson content strings.
 * Removes prefixes like "Scaffolded Question 1:", "Worked Example:", "Instructional Breakdown:", etc.
 * Also handles JSON-encoded strings that might be returned by AI sometimes.
 */
export const stripLabels = (text: string | any): any => {
    if (typeof text !== 'string') return text;

    let cleaned = text.trim();

    // Handle JSON-encoded strings (e.g., {"question": "...", "hint": "..."})
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
            const parsed = JSON.parse(cleaned);
            // Priority list of keys to extract for display
            const priorityKeys = ['question', 'prompt', 'text', 'label', 'content', 'term', 'definition', 'answer', 'explanation'];
            for (const key of priorityKeys) {
                if (parsed[key]) {
                    cleaned = String(parsed[key]);
                    break;
                }
            }
            // If no priority key matches but there's at least one value
            if (cleaned.startsWith('{')) {
                const values = Object.values(parsed);
                if (values.length > 0) cleaned = String(values[0]);
            }
        } catch (e) {
            // Not actually JSON or failed to parse, continue with normal cleaning
        }
    }

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

    cleaned = cleaned.trim();
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
