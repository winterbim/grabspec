import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { checkRateLimit } from '@/lib/ratelimit';
import { searchProduct, searchProductImages, formatSearchResults } from '@/lib/search';
import { fetchMultiplePages } from '@/lib/scraper';
import { extractProductData } from '@/lib/anthropic';
import { downloadFile, uploadToBlob } from '@/lib/storage';
import { nanoid } from 'nanoid';

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', status: 400 },
        { status: 400 }
      );
    }

    const { query, sessionId } = parsed.data;

    const rateCheck = await checkRateLimit(sessionId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', status: 429 },
        { status: 429 }
      );
    }

    const [webResults, imageResults] = await Promise.all([
      searchProduct(query),
      searchProductImages(query),
    ]);

    const pageUrls = webResults.map((r) => r.link).filter(Boolean);
    const pageContent = await fetchMultiplePages(pageUrls, 3);

    const searchContext = formatSearchResults(webResults, imageResults);
    const fullContext = `${searchContext}\n\n=== Contenu des pages ===\n${pageContent}`;

    const extraction = await extractProductData(query, fullContext);

    let photoBlobUrl: string | null = null;
    let datasheetBlobUrl: string | null = null;

    const photoUrl = extraction.photoUrl || imageResults[0]?.url || null;
    const datasheetUrl = extraction.datasheetUrl || null;

    if (photoUrl) {
      const downloaded = await downloadFile(photoUrl);
      if (downloaded) {
        const ext = photoUrl.includes('.png') ? 'png' : 'jpg';
        photoBlobUrl = await uploadToBlob(
          downloaded.buffer,
          `photos/${nanoid()}.${ext}`,
          downloaded.contentType
        );
      }
    }

    if (datasheetUrl) {
      const downloaded = await downloadFile(datasheetUrl);
      if (downloaded) {
        datasheetBlobUrl = await uploadToBlob(
          downloaded.buffer,
          `datasheets/${nanoid()}.pdf`,
          'application/pdf'
        );
      }
    }

    const hasPhoto = Boolean(photoBlobUrl || photoUrl);
    const hasDatasheet = Boolean(datasheetBlobUrl || datasheetUrl);
    let status: string = 'not_found';
    if (hasPhoto && hasDatasheet) status = 'found';
    else if (hasPhoto || hasDatasheet || extraction.resolvedName) status = 'partial';

    return NextResponse.json({
      data: {
        id: nanoid(),
        inputName: query,
        resolvedName: extraction.resolvedName,
        manufacturer: extraction.manufacturer,
        reference: extraction.reference,
        category: extraction.category,
        lot: null,
        photoUrl,
        photoBlobUrl,
        datasheetUrl,
        datasheetBlobUrl,
        specs: extraction.specs,
        searchStatus: status,
        sourceUrl: extraction.sourceUrl,
        createdAt: new Date().toISOString(),
        projectId: null,
      },
    });
  } catch (err) {
    // Never leak internal details (API keys, stack traces) to client
    const safeMessage = err instanceof Error && err.message === 'Service configuration error'
      ? 'Service temporarily unavailable'
      : 'Search failed';
    console.error('[search-single] Error:', err instanceof Error ? err.message : String(err));
    console.error('[search-single] Stack:', err instanceof Error ? err.stack : 'N/A');
    return NextResponse.json(
      { error: safeMessage, status: 500 },
      { status: 500 }
    );
  }
}
