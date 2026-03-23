/**
 * License key management system.
 * Allows the admin to create license keys that grant full access (business plan)
 * to any user who activates them. Stored in Upstash Redis.
 *
 * Redis keys:
 *   license:{key}           → JSON { email, plan, createdAt, activatedAt?, sessionId?, revoked? }
 *   license-by-session:{id} → license key (reverse lookup)
 *   licenses:index          → SET of all license keys (for listing)
 */

import { Redis } from '@upstash/redis';

export interface License {
  key: string;
  email: string;
  name: string;
  plan: 'pro' | 'business';
  createdAt: string;
  activatedAt: string | null;
  sessionId: string | null;
  revoked: boolean;
  note: string;
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Verify admin secret from request header */
export function verifyAdmin(authHeader: string | null): boolean {
  const secret = process.env.ADMIN_SECRET || 'GRAB-SPEC-91AW-JA91';
  return authHeader === `Bearer ${secret}`;
}

/** Generate a human-readable license key: GRAB-XXXX-XXXX-XXXX */
function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GRAB-${segment()}-${segment()}-${segment()}`;
}

/** Create a new license key (admin only) */
export async function createLicense(opts: {
  email: string;
  name: string;
  plan?: 'pro' | 'business';
  note?: string;
}): Promise<License> {
  const redis = getRedis();
  if (!redis) throw new Error('Redis not configured');

  const key = generateKey();
  const license: License = {
    key,
    email: opts.email,
    name: opts.name,
    plan: opts.plan || 'business',
    createdAt: new Date().toISOString(),
    activatedAt: null,
    sessionId: null,
    revoked: false,
    note: opts.note || '',
  };

  await redis.set(`license:${key}`, JSON.stringify(license));
  await redis.sadd('licenses:index', key);

  return license;
}

/** Activate a license key (links it to a sessionId and sets the plan) */
export async function activateLicense(
  licenseKey: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; license?: License }> {
  const redis = getRedis();
  if (!redis) return { success: false, error: 'Redis not configured' };

  const raw = await redis.get<string>(`license:${licenseKey}`);
  if (!raw) return { success: false, error: 'Clé de licence invalide' };

  let license: License;
  try {
    license = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as License;
  } catch {
    return { success: false, error: 'Données de licence corrompues' };
  }

  if (license.revoked) {
    return { success: false, error: 'Cette licence a été révoquée' };
  }

  if (license.activatedAt && license.sessionId && license.sessionId !== sessionId) {
    return { success: false, error: 'Cette licence est déjà utilisée par un autre utilisateur' };
  }

  // Activate
  license.activatedAt = new Date().toISOString();
  license.sessionId = sessionId;

  // Save license
  await redis.set(`license:${licenseKey}`, JSON.stringify(license));

  // Reverse lookup: session → license
  await redis.set(`license-by-session:${sessionId}`, licenseKey);

  // Set the plan in the same format as Stripe webhook (no expiry for licenses)
  const farFuture = new Date('2099-12-31').toISOString();
  await redis.set(
    `plan:${sessionId}`,
    JSON.stringify({ plan: license.plan, expiresAt: farFuture }),
  );

  return { success: true, license };
}

/** Revoke a license key (admin only) */
export async function revokeLicense(licenseKey: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const raw = await redis.get<string>(`license:${licenseKey}`);
  if (!raw) return false;

  let license: License;
  try {
    license = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as License;
  } catch {
    return false;
  }

  license.revoked = true;

  // If it was activated, also remove the plan
  if (license.sessionId) {
    await redis.del(`plan:${license.sessionId}`);
    await redis.del(`license-by-session:${license.sessionId}`);
  }

  await redis.set(`license:${licenseKey}`, JSON.stringify(license));

  return true;
}

/** List all licenses (admin only) */
export async function listLicenses(): Promise<License[]> {
  const redis = getRedis();
  if (!redis) return [];

  const keys = await redis.smembers('licenses:index');
  if (!keys || keys.length === 0) return [];

  const licenses: License[] = [];

  for (const key of keys) {
    const raw = await redis.get<string>(`license:${key}`);
    if (raw) {
      try {
        const license = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as License;
        licenses.push(license);
      } catch {
        // skip corrupted entries
      }
    }
  }

  // Sort: most recent first
  return licenses.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Check if a session has an active license */
export async function checkLicenseForSession(sessionId: string): Promise<License | null> {
  const redis = getRedis();
  if (!redis) return null;

  const licenseKey = await redis.get<string>(`license-by-session:${sessionId}`);
  if (!licenseKey) return null;

  const raw = await redis.get<string>(`license:${licenseKey}`);
  if (!raw) return null;

  try {
    const license = typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as License;
    if (license.revoked) return null;
    return license;
  } catch {
    return null;
  }
}
