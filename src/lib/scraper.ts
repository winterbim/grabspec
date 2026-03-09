const MAX_CONTENT_LENGTH = 5000;

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GrabSpec/1.0; +https://grabspec.com)',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return '';

    const html = await res.text();
    return extractTextFromHtml(html);
  } catch {
    return '';
  }
}

function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > MAX_CONTENT_LENGTH) {
    text = text.slice(0, MAX_CONTENT_LENGTH);
  }

  return text;
}

export async function fetchMultiplePages(
  urls: string[],
  maxPages: number = 3
): Promise<string> {
  const pagesToFetch = urls.slice(0, maxPages);

  const results = await Promise.allSettled(
    pagesToFetch.map((url) => fetchPageContent(url))
  );

  return results
    .map((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        return `--- Page ${i + 1}: ${pagesToFetch[i]} ---\n${result.value}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}
