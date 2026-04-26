import { getCollection, getEntry } from 'astro:content';

const START_YEAR = 2015;

function getExperienceYears(): string {
  return `${new Date().getFullYear() - START_YEAR}+`;
}

/**
 * Load site content (English).
 * Injects dynamic experience text into stats, hero, and about.
 */
export async function getSiteContent() {
  const entry = await getEntry('site', 'en');
  if (!entry) throw new Error('Site content not found');
  const data = entry.data;

  // Inject dynamic experience calculation
  const exp = getExperienceYears();
  data.stats.experience = exp;
  data.hero.experience = exp;
  data.about.experienceBadge = data.about.experienceBadge.replace(/\d+\+/, exp);

  return data;
}

/**
 * Load a service page by slug.
 */
export async function getServicePage(slug: string) {
  const entry = await getEntry('services', slug);
  return entry?.data ?? null;
}

/**
 * Get all service pages.
 */
export async function getAllServicePages() {
  const all = await getCollection('services');
  return all.map(e => e.data);
}

/**
 * Core service slugs — positionally aligned with `services.items` and
 * `footer.serviceLinks` in en.yaml. These appear in the homepage grid.
 */
export const SERVICE_SLUGS = [
  'angioplasty',
  'heart-failure',
  'hypertension-cholesterol',
  'pacemaker',
  'emergency-cardiac-care',
  'ecg-echo',
] as const;

/**
 * Extra service pages that don't appear in the homepage grid but are real
 * landing pages (own SEO targets). Static routes are still generated and
 * they appear in the sitemap.
 */
export const EXTRA_SERVICE_SLUGS = [
  'eecp',
  'diagnostics-pricing',
] as const;

/**
 * All service pages — used by getStaticPaths so every service.yaml gets a route.
 */
export const ALL_SERVICE_SLUGS = [...SERVICE_SLUGS, ...EXTRA_SERVICE_SLUGS] as const;

/**
 * Footer service slugs (matches SERVICE_SLUGS — homepage-grid services only).
 */
export const FOOTER_SERVICE_SLUGS = SERVICE_SLUGS;
