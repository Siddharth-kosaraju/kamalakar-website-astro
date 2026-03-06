import React, { useState } from 'react';
import LiteYouTube from './LiteYouTube';

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  duration?: string;
  transcript?: string;
  tags?: string[];
  keywords?: string;
}

interface VideoGalleryProps {
  videos: Video[];
  lang: 'en' | 'te';
  labels: {
    featuredVideos: string;
    upNext: string;
    watchNow: string;
    keywordsLabel?: string;
  };
}

export default function VideoGallery({ videos, lang, labels }: VideoGalleryProps) {
  const [activeVideo, setActiveVideo] = useState(videos[0]);

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-primary dark:text-white font-serif">
          {labels.featuredVideos}
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
            <LiteYouTube
              key={activeVideo.youtubeId}
              youtubeId={activeVideo.youtubeId}
              title={activeVideo.title}
              lang={lang}
            />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-primary dark:text-white font-serif">
              {activeVideo.title}
            </h3>
            {activeVideo.transcript && (
              <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10 italic">
                &ldquo;{activeVideo.transcript}&rdquo;
              </p>
            )}
            {activeVideo.tags && activeVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {activeVideo.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {activeVideo.keywords && (
              <div className="mt-4 text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest">
                {labels.keywordsLabel || 'Keywords:'} {activeVideo.keywords}
              </div>
            )}
          </div>
        </div>

        {/* Video Sidebar */}
        <div className="space-y-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <h4 className="text-sm font-bold text-secondary dark:text-gray-300 uppercase tracking-wider mb-4">
            {labels.upNext}
          </h4>
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className={`w-full group flex gap-4 p-3 rounded-xl transition-all duration-300 text-left ${
                activeVideo.id === video.id
                  ? 'bg-white dark:bg-gray-800 shadow-lg ring-1 ring-primary/10'
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 rounded">
                  {video.duration}
                </div>
              </div>
              <div>
                <h5 className={`font-bold text-sm line-clamp-2 mb-1 ${
                  activeVideo.id === video.id ? 'text-primary dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {video.title}
                </h5>
                <span className="text-xs text-secondary dark:text-gray-400 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                  {labels.watchNow}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
