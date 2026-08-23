import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getPublishedBlogPosts } from '../utils/content';
import type { APIContext } from 'astro';

const SITE = 'https://kamalakarheartcentre.com';

export async function GET(_context: APIContext) {
  const now = new Date();
  const posts = (await getPublishedBlogPosts())
    .map((p) => ({ entry: p, link: `${SITE}/blog/${p.id}/` }));

  // Case studies share the feed — robots.txt submits feed.xml as a sitemap for
  // freshness signals, so new case-study URLs should surface here too.
  const caseStudies = (await getCollection('caseStudies'))
    .filter((p) => p.data.published && p.data.date <= now)
    .map((p) => ({ entry: p, link: `${SITE}/case-study/${p.id}/` }));

  const items = [...posts, ...caseStudies].sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime()
  );

  return rss({
    title: 'Kamalakar Heart Centre — Heart Health Education',
    description:
      'Plain-English heart-health articles and patient case studies by Dr Kamalakar Kosaraju, Interventional Cardiologist at Kamalakar Heart Centre, Guntur.',
    site: SITE,
    items: items.map(({ entry, link }) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link,
      author: entry.data.author,
      categories: entry.data.tags ?? [],
    })),
    customData: `<language>en-in</language>`,
    stylesheet: false,
  });
}
