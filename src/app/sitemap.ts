import type { MetadataRoute } from 'next';

const locales = ['fr', 'en', 'es', 'de'];

const mainPages = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/finder', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/converter', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/library', changeFrequency: 'weekly' as const, priority: 0.7 },
];

const legalPages = [
  { path: '/legal', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://grabspec.com';
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of [...mainPages, ...legalPages]) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return entries;
}
