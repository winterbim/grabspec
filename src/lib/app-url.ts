import type { NextRequest } from 'next/server';

function normalizeEnvUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function getAppUrl(request?: NextRequest): string {
  const envUrl = normalizeEnvUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (envUrl) return envUrl;

  if (request) {
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');

    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }

    return request.nextUrl.origin;
  }

  return 'http://localhost:3000';
}
