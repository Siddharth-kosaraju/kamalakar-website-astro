import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const SITE = 'https://kamalakarheartcentre.com';

export async function GET(_context: APIContext) {
  const now = new Date();
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.published && p.data.date <= now)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Kamalakar Heart Centre — Heart Health Education',
    description:
      'Plain-English heart-health articles by Dr Kamalakar Kosaraju, Interventional Cardiologist at Kamalakar Heart Centre, Guntur.',
    site: SITE,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `${SITE}/blog/${post.id}/`,
      author: post.data.author,
      categories: post.data.tags ?? [],
    })),
    customData: `<language>en-in</language>`,
    stylesheet: false,
  });
}
