import { getCollection, getEntry } from 'astro:content';

export type Lang = 'en' | 'te';

const START_YEAR = 2015;

function getExperienceYears(): string {
  return `${new Date().getFullYear() - START_YEAR}+`;
}

/**
 * Load site content for a given language.
 * Injects dynamic experience text into stats, hero, and about.
 */
export async function getSiteContent(lang: Lang) {
  const entry = await getEntry('site', lang);
  if (!entry) throw new Error(`Site content not found for language: ${lang}`);
  const data = entry.data;

  // Inject dynamic experience calculation
  const exp = getExperienceYears();
  data.stats.experience = exp;
  data.hero.experience = exp;
  data.about.experienceBadge = data.about.experienceBadge.replace(/\d+\+/, exp);

  return data;
}

/**
 * Load a service page by slug and language.
 */
export async function getServicePage(slug: string, lang: Lang) {
  const id = lang === 'en' ? slug : `${slug}-te`;
  const entry = await getEntry('services', id);
  return entry?.data ?? null;
}

/**
 * Get all service pages for a language.
 */
export async function getAllServicePages(lang: Lang) {
  const all = await getCollection('services');
  const suffix = lang === 'en' ? '' : '-te';
  return all
    .filter(e => lang === 'en' ? !e.id.endsWith('-te') : e.id.endsWith('-te'))
    .map(e => e.data);
}

/**
 * Service slugs (shared between en and te).
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
 * Footer service slugs (matches SERVICE_SLUGS).
 */
export const FOOTER_SERVICE_SLUGS = SERVICE_SLUGS;
