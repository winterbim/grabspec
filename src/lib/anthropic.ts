import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod/v4';
import { createHash } from 'crypto';

/* ─── System prompt (never exposed to client) ─── */
const SYSTEM_PROMPT = `Tu es un assistant d'extraction de données techniques produit.

MISSION : À partir des résultats de recherche web, extraire pour un produit donné :
- Son nom complet officiel
- Le fabricant
- La référence/code
- L'URL directe de la meilleure photo HD (jpg/png/webp, PAS un thumbnail)
- L'URL directe du PDF de la fiche technique (PAS une page HTML)
- Les spécifications techniques principales

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide. Aucun texte avant ou après.
2. Si une info manque → null
3. Priorité aux sources constructeur/fabricant
4. photoUrl = lien DIRECT vers l'image (pas la page qui contient l'image)
5. datasheetUrl = lien DIRECT vers le .pdf
6. Pas d'invention — uniquement ce qui est dans les résultats fournis

JSON ATTENDU :
{
  "resolvedName": "string | null",
  "manufacturer": "string | null",
  "reference": "string | null",
  "category": "string | null",
  "photoUrl": "string | null",
  "datasheetUrl": "string | null",
  "specs": {
    "dimensions": "string | null",
    "poids": "string | null",
    "materiau": "string | null",
    "couleur": "string | null",
    "puissance": "string | null",
    "debit": "string | null",
    "pression": "string | null",
    "tension": "string | null",
    "certification": "string | null",
    "garantie": "string | null"
  },
  "sourceUrl": "string | null"
}`;

const extractionSchema = z.object({
  resolvedName: z.string().nullable(),
  manufacturer: z.string().nullable(),
  reference: z.string().nullable(),
  category: z.string().nullable(),
  photoUrl: z.string().nullable(),
  datasheetUrl: z.string().nullable(),
  specs: z.record(z.string(), z.string().nullable()).nullable(),
  sourceUrl: z.string().nullable(),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

/* ─── Singleton client — reads API key or falls back to Claude Code SSO token ─── */
let _client: Anthropic | null = null;

function resolveApiKey(): string {
  // 1. Explicit env var takes priority (production)
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  // 2. Fall back to Claude Code OAuth token (local dev SSO)
  try {
    const fs = require('fs');
    const path = require('path');
    const credPath = path.join(process.env.HOME || '', '.claude', '.credentials.json');
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    const token = creds?.claudeAiOauth?.accessToken;
    if (token) {
      const expiresAt = creds.claudeAiOauth.expiresAt || 0;
      if (Date.now() < expiresAt) {
        return token;
      }
      console.warn('[anthropic] SSO token expired, needs refresh');
    }
  } catch {
    // Credentials file not available
  }

  throw new Error('Service configuration error');
}

function getClient(): Anthropic {
  if (_client) return _client;
  const key = resolveApiKey();
  _client = new Anthropic({ apiKey: key });
  return _client;
}

/* ─── In-memory cache (survives across requests in same process) ─── */
const CACHE_TTL_MS = 1000 * 60 * 60; // 1h
const MAX_CACHE_SIZE = 500;

interface CacheEntry {
  data: ExtractionResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(query: string, context: string): string {
  return createHash('sha256')
    .update(`${query.toLowerCase().trim()}::${context.slice(0, 2000)}`)
    .digest('hex');
}

function getFromCache(key: string): ExtractionResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: ExtractionResult): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/* ─── Main extraction function ─── */
export async function extractProductData(
  query: string,
  searchResults: string
): Promise<ExtractionResult> {
  const key = cacheKey(query, searchResults);
  const cached = getFromCache(key);
  if (cached) return cached;

  const client = getClient();
  const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Produit : "${query}"\n\nRésultats web :\n${searchResults}\n\nExtrais les données en JSON.`,
      },
    ],
  });

  let text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip markdown code fences if present (```json ... ```)
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  const parsed = JSON.parse(text);
  const validated = extractionSchema.parse(parsed);

  setCache(key, validated);
  return validated;
}
