import { z } from 'zod/v4';

const serpResultSchema = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  snippet: z.string().optional(),
});

const serpImageSchema = z.object({
  original: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
});

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ImageResult {
  url: string;
  title: string;
  source: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/* ═══════════════════════════════════════════
   TIER 1 — Paid APIs (best quality)
   ═══════════════════════════════════════════ */

/* ─── Serper.dev ($1/1000 req, 2500 free credits) ─── */
async function searchWithSerper(query: string, type: 'web' | 'images'): Promise<unknown[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const endpoint = type === 'images'
    ? 'https://google.serper.dev/images'
    : 'https://google.serper.dev/search';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: 6, gl: 'ch', hl: 'fr' }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  if (type === 'images') return data.images || [];
  return data.organic || [];
}

/* ─── SerpAPI ─── */
async function searchWithSerpApi(query: string, type: 'web' | 'images'): Promise<unknown[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: type === 'images' ? 'google_images' : 'google',
    num: '5',
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  const data = await res.json();
  return type === 'images' ? (data.images_results || []) : (data.organic_results || []);
}

/* ─── Google Custom Search API ─── */
async function searchWithGoogleCSE(query: string, searchType?: 'image'): Promise<unknown[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) return [];

  const params = new URLSearchParams({ q: query, key: apiKey, cx, num: '5' });
  if (searchType === 'image') params.set('searchType', 'image');

  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

/* ═══════════════════════════════════════════
   TIER 2 — Free scrapers (no API key needed)
   ═══════════════════════════════════════════ */

/* ─── Decode Bing redirect URLs ─── */
function decodeBingUrl(rawUrl: string): string {
  if (!rawUrl.includes('bing.com/ck/a')) return rawUrl;
  const uMatch = rawUrl.match(/[&;]u=([^&"]+)/);
  if (!uMatch) return rawUrl;
  const encoded = decodeURIComponent(uMatch[1].replace(/&amp;/g, '&'));
  const b64 = encoded.startsWith('a1') ? encoded.slice(2) : encoded;
  try {
    return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    return rawUrl;
  }
}

/* ─── Bing HTML scraper (works from Vercel) ─── */
async function searchWithBingHTML(query: string): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams({ q: query, count: '10' });
    const res = await fetch(`https://www.bing.com/search?${params}`, {
      signal: controller.signal,
      headers: { 'User-Agent': randomUA(), 'Accept': 'text/html' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const html = await res.text();
    const results: SearchResult[] = [];

    const blocks = html.split(/<li class="b_algo"/);
    for (let i = 1; i < blocks.length && results.length < 6; i++) {
      const block = blocks[i];
      const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!linkMatch) continue;
      const rawLink = linkMatch[1].replace(/&amp;/g, '&');
      const link = decodeBingUrl(rawLink);
      if (!link.startsWith('http') || link.includes('bing.com') || link.includes('microsoft.com')) continue;
      const title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (title && link) results.push({ title, link, snippet });
    }
    return results;
  } catch {
    return [];
  }
}

/* ─── DuckDuckGo HTML fallback ─── */
async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const params = new URLSearchParams({ q: query });
    const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      signal: controller.signal,
      headers: { 'User-Agent': randomUA(), 'Accept': 'text/html' },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();

    const results: SearchResult[] = [];
    const resultBlocks = html.split(/class="result results_links[^"]*web-result[^"]*"/);
    for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const urlMatch = block.match(/uddg=([^&"]+)/);
      let link = '';
      if (urlMatch) {
        try { link = decodeURIComponent(urlMatch[1]); } catch { link = urlMatch[1]; }
      }
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (title && link) results.push({ title, link, snippet });
    }
    return results;
  } catch {
    return [];
  }
}

/* ─── DuckDuckGo Images API (JSON endpoint, may work from Vercel) ─── */
async function searchDDGImages(query: string): Promise<ImageResult[]> {
  try {
    // Step 1: get vqd token
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': randomUA() },
    });
    if (!tokenRes.ok) return [];
    const tokenHtml = await tokenRes.text();
    const vqdMatch = tokenHtml.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return [];

    // Step 2: fetch images
    const params = new URLSearchParams({
      l: 'fr-fr', o: 'json', q: query, vqd: vqdMatch[1], f: ',,,,,', p: '1',
    });
    const imgRes = await fetch(`https://duckduckgo.com/i.js?${params}`, {
      headers: { 'User-Agent': randomUA(), 'Referer': 'https://duckduckgo.com/' },
    });
    if (!imgRes.ok) return [];
    const data = await imgRes.json();

    return (data.results || []).slice(0, 5).map((r: Record<string, string>) => ({
      url: r.image || '',
      title: r.title || '',
      source: r.source || r.url || '',
    }));
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════
   Multi-engine orchestration
   ═══════════════════════════════════════════ */

async function multiSearch(query: string): Promise<SearchResult[]> {
  // Tier 1: Try paid APIs first (best results)
  const paidSearchers: Array<() => Promise<SearchResult[]>> = [];

  if (process.env.SERPER_API_KEY) {
    paidSearchers.push(async () => {
      const results = await searchWithSerper(query, 'web');
      return results.slice(0, 6).map((r: unknown) => {
        const item = r as Record<string, string>;
        return { title: item.title || '', link: item.link || '', snippet: item.snippet || '' };
      });
    });
  }

  if (process.env.SERPAPI_KEY) {
    paidSearchers.push(async () => {
      const results = await searchWithSerpApi(query, 'web');
      return results.slice(0, 5).map((r: unknown) => {
        const parsed = serpResultSchema.parse(r);
        return { title: parsed.title || '', link: parsed.link || '', snippet: parsed.snippet || '' };
      });
    });
  }

  if (process.env.GOOGLE_CSE_API_KEY) {
    paidSearchers.push(async () => {
      const items = await searchWithGoogleCSE(query);
      return items.slice(0, 5).map((item: unknown) => {
        const r = item as Record<string, string>;
        return { title: r.title || '', link: r.link || '', snippet: r.snippet || '' };
      });
    });
  }

  for (const searcher of paidSearchers) {
    try {
      const results = await searcher();
      if (results.length > 0) return results;
    } catch { /* fall through */ }
  }

  // Tier 2: Free scrapers in parallel (Bing > DDG > Google HTML)
  const [bingResults, ddgResults] = await Promise.all([
    searchWithBingHTML(query),
    searchWithDuckDuckGo(query),
  ]);

  if (bingResults.length > 0) return bingResults;
  if (ddgResults.length > 0) return ddgResults;

  return [];
}

async function multiImageSearch(query: string): Promise<ImageResult[]> {
  // Tier 1: Paid APIs
  if (process.env.SERPER_API_KEY) {
    try {
      const results = await searchWithSerper(query, 'images');
      if (results.length > 0) {
        return results.slice(0, 5).map((r: unknown) => {
          const item = r as Record<string, string>;
          return { url: item.imageUrl || item.link || '', title: item.title || '', source: item.source || item.domain || '' };
        });
      }
    } catch { /* fall through */ }
  }

  if (process.env.SERPAPI_KEY) {
    try {
      const results = await searchWithSerpApi(query, 'images');
      if (results.length > 0) {
        return results.slice(0, 5).map((r: unknown) => {
          const parsed = serpImageSchema.parse(r);
          return { url: parsed.original || '', title: parsed.title || '', source: parsed.source || '' };
        });
      }
    } catch { /* fall through */ }
  }

  if (process.env.GOOGLE_CSE_API_KEY) {
    try {
      const items = await searchWithGoogleCSE(query, 'image');
      if (items.length > 0) {
        return items.slice(0, 5).map((item: unknown) => {
          const r = item as Record<string, string>;
          return { url: r.link || '', title: r.title || '', source: r.displayLink || '' };
        });
      }
    } catch { /* fall through */ }
  }

  // Tier 2: Free DDG images API + web search fallback
  const [ddgImages, webResults] = await Promise.all([
    searchDDGImages(query),
    multiSearch(`${query} photo produit HD`),
  ]);

  if (ddgImages.length > 0) return ddgImages;

  return webResults.slice(0, 3).map((r) => ({
    url: r.link,
    title: r.title,
    source: r.link,
  }));
}

/* ═══════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════ */

export async function searchProduct(query: string): Promise<SearchResult[]> {
  return multiSearch(`${query} fiche technique PDF`);
}

export async function searchProductImages(query: string): Promise<ImageResult[]> {
  return multiImageSearch(`${query} photo produit HD`);
}

export function formatSearchResults(
  webResults: SearchResult[],
  imageResults: ImageResult[]
): string {
  const webSection = webResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.link}\n${r.snippet}`)
    .join('\n\n');

  const imageSection = imageResults
    .map((r, i) => `[Image ${i + 1}] ${r.title}\nURL: ${r.url}\nSource: ${r.source}`)
    .join('\n\n');

  return `=== Résultats web ===\n${webSection}\n\n=== Images ===\n${imageSection}`;
}
