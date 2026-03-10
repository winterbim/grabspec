/**
 * Analytics, Business Intelligence, and Monetization features
 */

import type { LocalProduct } from './db';

export interface AnalyticsMetrics {
  totalSearches: number;
  averageSearchTime: number;
  successRate: number;
  photosCaptured: number;
  datasheetsCaptured: number;
  exportCount: number;
  topManufacturers: { name: string; count: number }[];
  topCategories: { category: string; count: number }[];
  searchTrends: { date: string; count: number }[];
}

export interface AffiliateEvent {
  productId: string;
  productName: string;
  manufacturer: string;
  source: 'amazon' | 'alibaba' | 'distributor';
  timestamp: string;
  clickedBy: string; // sessionId
  commission?: number;
}

/**
 * Track affiliate clicks for revenue sharing
 */
export function trackAffiliateClick(
  event: AffiliateEvent,
  sessionId: string
): Promise<void> {
  return fetch('/api/analytics/affiliate-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, clickedBy: sessionId }),
  }).then((res) => {
    if (!res.ok) throw new Error('Failed to track affiliate click');
  });
}

/**
 * Generate analytics dashboard data for Business plan
 */
export async function getAnalyticsDashboard(
  sessionId: string,
  dateRange?: { from: Date; to: Date }
): Promise<AnalyticsMetrics> {
  const query = new URLSearchParams();
  query.append('sessionId', sessionId);
  if (dateRange) {
    query.append('from', dateRange.from.toISOString());
    query.append('to', dateRange.to.toISOString());
  }

  const response = await fetch(`/api/analytics/dashboard?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

/**
 * Export analytics to Looker/Tableau format
 */
export async function exportAnalyticsToBI(
  sessionId: string,
  format: 'looker' | 'tableau' | 'csv'
): Promise<Blob> {
  const response = await fetch(`/api/analytics/export?format=${format}&sessionId=${sessionId}`);
  if (!response.ok) throw new Error('Failed to export analytics');
  return response.blob();
}

/**
 * White label configuration
 */
export interface WhiteLabelConfig {
  companyName: string;
  logo: string;
  primaryColor: string;
  domain: string;
  supportEmail: string;
  terms: string;
  privacy: string;
  customBranding: boolean;
}

/**
 * Setup white label branding
 */
export async function setupWhiteLabelBranding(config: WhiteLabelConfig): Promise<void> {
  const response = await fetch('/api/admin/whitelabel-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) throw new Error('Failed to setup white label');
}

/**
 * Freemium funnel optimization
 */
export interface FreeToProConversion {
  sessionId: string;
  step: 'trial-started' | 'trial-completed' | 'limit-hit' | 'upgrade-click' | 'purchase';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function trackConversionStep(step: FreeToProConversion): Promise<void> {
  return fetch('/api/analytics/conversion-funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step),
  }).then((res) => {
    if (!res.ok) throw new Error('Failed to track conversion step');
  });
}

/**
 * Regional pricing and localization
 */
export interface RegionalConfig {
  region: 'eu' | 'us' | 'asia' | 'ch' | 'de';
  currency: string;
  pricingMultiplier: number;
  vat: number;
  supportedLanguages: string[];
  localDistributors: string[];
  scraperRules?: Record<string, string>;
}

export const regionConfig: Record<string, RegionalConfig> = {
  eu: {
    region: 'eu',
    currency: 'EUR',
    pricingMultiplier: 1,
    vat: 0.19,
    supportedLanguages: ['fr', 'de', 'es', 'en'],
    localDistributors: ['Heilind', 'Mersen', 'Sonepar'],
  },
  ch: {
    region: 'ch',
    currency: 'CHF',
    pricingMultiplier: 1.15,
    vat: 0.077,
    supportedLanguages: ['fr', 'de', 'it'],
    localDistributors: ['Anixter Switzerland', 'Acal BFi'],
  },
  de: {
    region: 'de',
    currency: 'EUR',
    pricingMultiplier: 1,
    vat: 0.19,
    supportedLanguages: ['de', 'en'],
    localDistributors: ['ConradDE', 'Heilind.de'],
    scraperRules: {
      bosch: 'https://bosch-de.com/products',
      siemens: 'https://siemens-de.com/industrie',
    },
  },
};

/**
 * Enterprise features: Role-based access control
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface RBACPolicy {
  role: UserRole;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManageUsers: boolean;
  canAccessAPI: boolean;
  canViewAnalytics: boolean;
}

export const rbacPolicies: Record<UserRole, RBACPolicy> = {
  admin: {
    role: 'admin',
    canView: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
    canAccessAPI: true,
    canViewAnalytics: true,
  },
  editor: {
    role: 'editor',
    canView: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canManageUsers: false,
    canAccessAPI: false,
    canViewAnalytics: true,
  },
  viewer: {
    role: 'viewer',
    canView: true,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canManageUsers: false,
    canAccessAPI: false,
    canViewAnalytics: false,
  },
};

/**
 * Get regional pricing
 */
export function getRegionalPricing(region: string = 'eu') {
  const config = regionConfig[region] || regionConfig.eu;
  const basePrices = {
    pro_monthly: 7.99,
    pro_yearly: 59.99,
    business_monthly: 24.99,
    business_yearly: 199.99,
  };

  return {
    currency: config.currency,
    vat: config.vat,
    prices: Object.entries(basePrices).reduce(
      (acc, [key, price]) => {
        acc[key] = price * config.pricingMultiplier * (1 + config.vat);
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Calculate affiliate commission
 */
export function calculateAffiliateCommission(
  productPrice: number,
  source: 'amazon' | 'alibaba' | 'distributor'
): number {
  const rates = {
    amazon: 0.03,
    alibaba: 0.02,
    distributor: 0.05,
  };
  return productPrice * rates[source];
}

/**
 * SLA support tiers
 */
export type SLATier = 'free' | 'pro' | 'business';

export interface SLATerms {
  tier: SLATier;
  responseTime: number; // hours
  availabilityTarget: number; // percentage
  supportChannels: string[];
  features: string[];
}

export const slaTerms: Record<SLATier, SLATerms> = {
  free: {
    tier: 'free',
    responseTime: 48,
    availabilityTarget: 0.95,
    supportChannels: ['email'],
    features: ['3 searches/day', 'Community forums'],
  },
  pro: {
    tier: 'pro',
    responseTime: 24,
    availabilityTarget: 0.99,
    supportChannels: ['email', 'community'],
    features: ['Unlimited searches', 'Custom nomenclature', 'Priority support'],
  },
  business: {
    tier: 'business',
    responseTime: 2,
    availabilityTarget: 0.999,
    supportChannels: ['email', 'slack', 'phone'],
    features: [
      'Unlimited searches',
      'Team management',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
  },
};
