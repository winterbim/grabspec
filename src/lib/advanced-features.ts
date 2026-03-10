/**
 * Advanced technical features:
 * - Streaming search results
 * - Offline/caching support
 * - Service Worker integration
 */

/**
 * Stream search results in real-time using Server-Sent Events
 */
export async function streamSearchResults(
  query: string,
  onProduct: (product: {
    reference: string;
    status: 'pending' | 'found' | 'error';
    imageUrl?: string;
    datasheetUrl?: string;
  }) => void,
  onError?: (error: Error) => void
) {
  try {
    const response = await fetch('/api/finder/search-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onProduct(data);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

/**
 * Smart prefetching strategy for products
 */
export async function prefetchProductData(manufacturer: string) {
  if (!navigator.serviceWorker?.controller) return;

  const cache = await caches.open('grabspec-products-v1');

  // Prefetch common product searches for this manufacturer
  const commonProducts = [
    `${manufacturer} specifications`,
    `${manufacturer} datasheets`,
    `${manufacturer} products`,
  ];

  for (const query of commonProducts) {
    const url = `/api/finder/search?q=${encodeURIComponent(query)}&prefetch=true`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch {
      // Ignore prefetch errors
    }
  }
}

/**
 * Offline search support - search cached results
 */
export async function searchOfflineResults(query: string) {
  const cache = await caches.open('grabspec-products-v1');
  const keys = await cache.keys();

  const matchingRequests = keys.filter((req) => {
    const url = new URL(req.url);
    return url.searchParams.get('q')?.includes(query);
  });

  const results = [];
  for (const req of matchingRequests) {
    const response = await cache.match(req);
    if (response) {
      const data = await response.json();
      results.push(data);
    }
  }

  return results;
}

/**
 * Setup Service Worker for offline support
 */
export async function registerOfflineWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Every minute

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

/**
 * Sync pending searches when back online
 */
export async function syncPendingSearches() {
  if (!navigator.serviceWorker?.controller) return;

  const cache = await caches.open('grabspec-pending-v1');
  const keys = await cache.keys();

  for (const req of keys) {
    try {
      const response = await fetch(req.clone());
      if (response.ok) {
        await cache.delete(req);
      }
    } catch {
      // Still offline, keep in queue
    }
  }
}

/**
 * Monitor connection status and trigger syncs
 */
export function setupOfflineSync() {
  window.addEventListener('online', () => {
    console.log('Back online - syncing pending searches...');
    syncPendingSearches();
  });

  window.addEventListener('offline', () => {
    console.log('Offline mode enabled');
  });

  // Initial sync if online
  if (navigator.onLine) {
    syncPendingSearches();
  }
}

/**
 * Vision-based product recognition using Claude
 */
export async function extractSpecsFromImage(imageBlob: Blob, context: string) {
  const base64 = await blobToBase64(imageBlob);

  const response = await fetch('/api/finder/extract-from-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      context,
    }),
  });

  if (!response.ok) throw new Error('Failed to extract specs from image');
  return response.json();
}

/**
 * OCR and text extraction from PDF datasheets
 */
export async function extractTextFromPDF(pdfUrl: string) {
  const response = await fetch('/api/finder/extract-pdf-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfUrl }),
  });

  if (!response.ok) throw new Error('Failed to extract text from PDF');
  return response.json();
}

/**
 * Generate summary from datasheet using Claude
 */
export async function generateDatasheetSummary(datasheetUrl: string) {
  const response = await fetch('/api/finder/summarize-datasheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasheetUrl }),
  });

  if (!response.ok) throw new Error('Failed to generate summary');
  return response.json();
}

/**
 * Utility: Convert Blob to Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
