/**
 * Extract product references from raw document text.
 * Uses pattern matching + manufacturer prefix database.
 */

import { nanoid } from 'nanoid';
import { matchReference, matchByKeyword } from './manufacturerMatcher';

export interface ExtractedReference {
  id: string;
  value: string;
  manufacturer: string | null;
  confidence: number;
  line: number;
  context: string;
}

// ─── Reference patterns (ordered by specificity) ────────────

interface RefPattern {
  regex: RegExp;
  baseConfidence: number;
}

const PATTERNS: RefPattern[] = [
  // Geberit dotted: 111.300.00.5 or 115.883.KH.1
  { regex: /\b(\d{3}\.\d{3}\.[A-Z0-9]{2}\.\d{1,2})\b/gi, baseConfidence: 90 },

  // Long ABB/Schneider codes: 2CDS251001R0164
  { regex: /\b(\d[A-Z]{2,3}\d{5,}[A-Z]\d{3,})\b/g, baseConfidence: 85 },

  // Dash-separated codes: 5SY3120-6, 3RV2011-1BA10, LC1-D09M7
  { regex: /\b([A-Z0-9]{2,6}-[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,8}){0,3})\b/g, baseConfidence: 70 },

  // Mixed letters+digits starting with 2+ letters: WAX32M40CH, FTXM25R, MBN116E
  { regex: /\b([A-Z]{2,5}\d[A-Z0-9]{2,15})\b/g, baseConfidence: 65 },

  // Schneider-style: A9F74210, A9D11216
  { regex: /\b([A-Z]\d[A-Z]\d{4,8})\b/g, baseConfidence: 75 },

  // Letter + long numeric: A342767000, E0750580
  { regex: /\b([A-Z]\d{6,12})\b/g, baseConfidence: 60 },

  // Villeroy style: 4614R201, 5685R001
  { regex: /\b(\d{4}[A-Z]\d{3,4})\b/g, baseConfidence: 65 },

  // Pure 7-12 digit numeric: 33265003 (Grohe), 71700000 (Hansgrohe)
  { regex: /\b(\d{7,12})\b/g, baseConfidence: 45 },

  // 6-digit with leading zero: 077040 (Legrand)
  { regex: /\b(0\d{5,6})\b/g, baseConfidence: 55 },
];

// ─── Exclusion patterns (false positives) ────────────────────

const EXCLUSIONS = [
  // Dates: DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD
  /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/,
  /^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/,
  // Phone numbers
  /^\+?\d{2,3}\s?\d/,
  /^0[1-9]\d{8,9}$/,
  /^00\d{10,}/,
  // Postal codes (CH 4 digits, FR 5 digits) — too short, already filtered by min length
  // Currency-like
  /^\d+[.,]\d{2}$/,
  // Pure round numbers (likely quantities/amounts)
  /^[1-9]0{4,}$/,
  // IP addresses
  /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  // Common abbreviations that look like refs
  /^(ISO|DIN|NF|EN|SIA|ASTM|ANSI)\d/i,
];

const CONTEXT_KEYWORDS = [
  'réf', 'ref', 'référence', 'reference', 'art', 'article',
  'n°', 'no.', 'code', 'modèle', 'model', 'type',
  'produit', 'product', 'pièce', 'piece',
];

function isExcluded(value: string): boolean {
  return EXCLUSIONS.some((re) => re.test(value));
}

function hasContextKeyword(line: string): boolean {
  const lower = line.toLowerCase();
  return CONTEXT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extract all product references from document text.
 */
export function extractReferences(text: string): ExtractedReference[] {
  const lines = text.split('\n');
  const seen = new Map<string, ExtractedReference>();

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line.trim()) continue;

    // Get nearby context (current line + adjacent lines)
    const contextLines = [
      lines[lineIdx - 1] || '',
      line,
      lines[lineIdx + 1] || '',
    ].join(' ');

    for (const pattern of PATTERNS) {
      // Reset regex lastIndex for each line
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        const value = match[1];

        // Minimum length check
        if (value.length < 5) continue;

        // Must contain at least one digit
        if (!/\d/.test(value)) continue;

        // Exclusion check
        if (isExcluded(value)) continue;

        // Normalize for dedup
        const normalized = value.toUpperCase().replace(/\s+/g, '');
        if (seen.has(normalized)) {
          // Keep the one with higher confidence
          const existing = seen.get(normalized)!;
          const { confidence: newConf } = scoreCandidate(
            value, contextLines, pattern.baseConfidence,
          );
          if (newConf > existing.confidence) {
            seen.set(normalized, {
              ...existing,
              confidence: newConf,
              line: lineIdx + 1,
              context: line.trim().slice(0, 120),
            });
          }
          continue;
        }

        const { manufacturer, confidence } = scoreCandidate(
          value, contextLines, pattern.baseConfidence,
        );

        seen.set(normalized, {
          id: nanoid(10),
          value,
          manufacturer,
          confidence,
          line: lineIdx + 1,
          context: line.trim().slice(0, 120),
        });
      }
    }
  }

  // Sort by line number, then confidence descending
  return Array.from(seen.values()).sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return b.confidence - a.confidence;
  });
}

function scoreCandidate(
  value: string,
  contextLines: string,
  baseConfidence: number,
): { manufacturer: string | null; confidence: number } {
  const { manufacturer, confidence: matchConfidence } = matchReference(value, contextLines);

  // Start with the pattern's base confidence
  let score = baseConfidence;

  // Boost from manufacturer match
  if (manufacturer) {
    score = Math.max(score, matchConfidence);
  }

  // Boost if reference keyword nearby
  if (hasContextKeyword(contextLines)) {
    score = Math.min(100, score + 10);
  }

  // Boost for longer references (more likely real)
  if (value.length >= 10) {
    score = Math.min(100, score + 5);
  }

  // Penalize pure numeric short references
  if (/^\d+$/.test(value) && value.length < 8 && !manufacturer) {
    score = Math.max(10, score - 15);
  }

  return { manufacturer, confidence: Math.round(Math.min(100, score)) };
}
