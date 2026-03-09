import { put } from '@vercel/blob';

export async function uploadToBlob(
  buffer: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;

    const blob = await put(filename, Buffer.from(buffer), {
      access: 'public',
      contentType,
      token,
    });

    return blob.url;
  } catch {
    return null;
  }
}

export async function downloadFile(
  url: string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GrabSpec/1.0; +https://grabspec.com)',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    if (buffer.byteLength === 0) return null;

    return { buffer, contentType };
  } catch {
    return null;
  }
}
