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

/* ─── SerpAPI search (when key is available) ─── */
async function searchWithSerpApi(query: string, type: 'web' | 'images'): Promise<unknown[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: type === 'web' ? `${query} fiche technique PDF` : `${query} photo produit HD`,
    api_key: apiKey,
    engine: type === 'images' ? 'google_images' : 'google',
    num: '5',
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  const data = await res.json();
  return type === 'images' ? (data.images_results || []) : (data.organic_results || []);
}

/* ─── DuckDuckGo HTML fallback (no API key needed) ─── */
async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams({ q: query });
    const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });

    clearTimeout(timeout);
    const html = await res.text();

    const results: SearchResult[] = [];

    // Split on each result block (class contains "web-result")
    const resultBlocks = html.split(/class="result results_links[^"]*web-result[^"]*"/);
    for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
      const block = resultBlocks[i];

      // Extract title from result__a
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // Extract URL from uddg parameter in href
      const urlMatch = block.match(/uddg=([^&"]+)/);
      let link = '';
      if (urlMatch) {
        try {
          link = decodeURIComponent(urlMatch[1]);
        } catch {
          link = urlMatch[1];
        }
      }

      // Extract snippet from result__snippet
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      if (title && link) {
        results.push({ title, link, snippet });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/* ─── Public API ─── */
export async function searchProduct(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (apiKey) {
    try {
      const results = await searchWithSerpApi(query, 'web');
      return results.slice(0, 5).map((r: unknown) => {
        const parsed = serpResultSchema.parse(r);
        return {
          title: parsed.title || '',
          link: parsed.link || '',
          snippet: parsed.snippet || '',
        };
      });
    } catch {
      // Fall through to DuckDuckGo
    }
  }

  return searchWithDuckDuckGo(`${query} fiche technique PDF`);
}

export async function searchProductImages(
  query: string
): Promise<ImageResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (apiKey) {
    try {
      const results = await searchWithSerpApi(query, 'images');
      return results.slice(0, 5).map((r: unknown) => {
        const parsed = serpImageSchema.parse(r);
        return {
          url: parsed.original || '',
          title: parsed.title || '',
          source: parsed.source || '',
        };
      });
    } catch {
      // Fall through
    }
  }

  // Fallback: search web for product images
  const webResults = await searchWithDuckDuckGo(`${query} photo produit HD`);
  return webResults.slice(0, 3).map((r) => ({
    url: r.link,
    title: r.title,
    source: r.link,
  }));
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
