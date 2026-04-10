import React, { useState } from 'react';

interface LiteYouTubeProps {
  youtubeId: string;
  title: string;
  className?: string;
}

export default function LiteYouTube({ youtubeId, title, className }: LiteYouTubeProps) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <iframe
        className={className || 'w-full h-full'}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&hl=en`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className={`relative w-full h-full cursor-pointer group bg-black ${className || ''}`}
      onClick={() => setActivated(true)}
      aria-label={`Play video: ${title}`}
    >
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
        alt={title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-12 flex items-center justify-center rounded-xl bg-red-600 group-hover:bg-red-500 transition-colors shadow-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-0.5" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
