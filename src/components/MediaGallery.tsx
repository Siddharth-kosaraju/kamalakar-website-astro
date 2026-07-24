import React, { useState, useMemo } from 'react';
import LiteYouTube from './LiteYouTube';

export interface MediaGalleryItem {
  slug: string;
  displayTitle: string;
  youtubeId: string;
  category: string;
  language: string;
  tier: 'featured' | 'full' | 'grid-only';
  description?: string;
  keyPoints?: string[];
  isShort: boolean;
  hasPage: boolean;
}

interface MediaGalleryProps {
  items: MediaGalleryItem[];
  categories: string[];
}

function VideoCard({ item, portrait }: { item: MediaGalleryItem; portrait: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const aspect = portrait ? 'aspect-[9/16]' : 'aspect-video';

  const thumb = (
    <div className={`relative ${aspect} w-full rounded-xl overflow-hidden bg-black shadow-sm`}>
      {expanded ? (
        <LiteYouTube youtubeId={item.youtubeId} title={item.displayTitle} className="w-full h-full absolute inset-0" />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            if (item.hasPage) return; // let the wrapping <a> handle navigation
            e.preventDefault();
            setExpanded(true);
          }}
          className="relative w-full h-full cursor-pointer group"
          aria-label={`Play video: ${item.displayTitle}`}
        >
          <img
            src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
            alt={item.displayTitle}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-11 h-9 flex items-center justify-center rounded-lg bg-red-600 group-hover:bg-red-500 transition-colors shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white ml-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-shrink-0">
      {item.hasPage ? (
        <a href={`/media/${item.slug}/`} className="block group">
          {thumb}
        </a>
      ) : (
        thumb
      )}
      <div className="mt-2 px-0.5">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
          {item.category}
        </span>
        {item.hasPage ? (
          <a href={`/media/${item.slug}/`} className="block">
            <h3 className="text-sm font-bold text-primary dark:text-white leading-snug line-clamp-2 hover:text-accent dark:hover:text-accent-light transition-colors">
              {item.displayTitle}
            </h3>
          </a>
        ) : (
          <h3 className="text-sm font-bold text-primary dark:text-white leading-snug line-clamp-2">
            {item.displayTitle}
          </h3>
        )}
      </div>
    </div>
  );
}

export default function MediaGallery({ items, categories }: MediaGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const featured = useMemo(() => items.find((i) => i.tier === 'featured') || items[0], [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => i.slug !== featured?.slug && (activeCategory === 'All' || i.category === activeCategory)
      ),
    [items, activeCategory, featured]
  );

  return (
    <section>
      {/* Featured player */}
      {featured && (
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-14">
          <div className="lg:col-span-2">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
              <LiteYouTube youtubeId={featured.youtubeId} title={featured.displayTitle} />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent mb-2">
              {featured.category}
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-serif text-primary dark:text-white mb-3 leading-tight">
              {featured.displayTitle}
            </h2>
            {featured.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {featured.description}
              </p>
            )}
            {featured.keyPoints && featured.keyPoints.length > 0 && (
              <ul className="space-y-2">
                {featured.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-accent font-bold flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {featured.hasPage && (
              <a
                href={`/media/${featured.slug}/`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-primary dark:text-white hover:text-accent dark:hover:text-accent-light transition-colors"
              >
                Read full details
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Category filter chips — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-white dark:bg-accent dark:text-primary-dark'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Single grid, strictly in admin-managed order — Shorts (portrait) and
          long-form (landscape) videos are interleaved as-ordered rather than
          grouped by format, so reordering in /admin/ actually reflects here. */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((item) => (
            <VideoCard key={item.slug} item={item} portrait={item.isShort} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
          No videos in this category yet — check back soon.
        </p>
      )}
    </section>
  );
}
