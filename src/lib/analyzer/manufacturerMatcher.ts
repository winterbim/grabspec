import prefixData from '@/data/manufacturers-prefixes.json';

const prefixes = prefixData.prefixes as Record<string, string>;
const keywords = prefixData.keywords as Record<string, string>;

// Sort prefixes by length descending so longer prefixes match first
const sortedPrefixes = Object.keys(prefixes).sort((a, b) => b.length - a.length);

/**
 * Match a reference string against known manufacturer prefixes.
 * Returns the manufacturer name and a confidence boost, or null.
 */
export function matchByPrefix(reference: string): { manufacturer: string; boost: number } | null {
  const upper = reference.toUpperCase();
  for (const prefix of sortedPrefixes) {
    if (upper.startsWith(prefix.toUpperCase())) {
      return { manufacturer: prefixes[prefix], boost: 25 };
    }
  }
  return null;
}

/**
 * Scan a line of text for manufacturer keywords.
 * Returns the first matched manufacturer or null.
 */
export function matchByKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  // Check multi-word keywords first (longer = more specific)
  const sorted = Object.keys(keywords).sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    if (lower.includes(kw)) {
      return keywords[kw];
    }
  }
  return null;
}

/**
 * Determine manufacturer for a reference using both prefix and context.
 * Returns manufacturer name and confidence score (0-100).
 */
export function matchReference(
  reference: string,
  contextLine: string,
): { manufacturer: string | null; confidence: number } {
  const prefixMatch = matchByPrefix(reference);
  const keywordMatch = matchByKeyword(contextLine);

  // Both prefix and keyword agree
  if (prefixMatch && keywordMatch && prefixMatch.manufacturer === keywordMatch) {
    return { manufacturer: prefixMatch.manufacturer, confidence: 95 };
  }

  // Prefix match with keyword for different manufacturer — trust prefix
  if (prefixMatch && keywordMatch) {
    return { manufacturer: prefixMatch.manufacturer, confidence: 75 };
  }

  // Prefix match only
  if (prefixMatch) {
    return { manufacturer: prefixMatch.manufacturer, confidence: 80 };
  }

  // Keyword match only (manufacturer name near the reference)
  if (keywordMatch) {
    return { manufacturer: keywordMatch, confidence: 60 };
  }

  // No match at all
  return { manufacturer: null, confidence: 35 };
}
