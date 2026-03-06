import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

interface GalleryContent {
  heading: string;
  description: string;
  close?: string;
  imageCounter?: string;
  images: GalleryImage[];
}

export default function Gallery({ content }: { content: GalleryContent }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const getGridColSpan = (ar?: string) => ar === 'landscape' ? 'md:col-span-2' : 'md:col-span-1';
  const getAspectClass = (ar?: string) => ar === 'portrait' ? 'aspect-[3/4]' : ar === 'landscape' ? 'aspect-[16/9]' : 'aspect-square';

  return (
    <section id="gallery" className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-serif text-primary dark:text-white mb-4">{content.heading}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{content.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-max">
          {content.images.map((image, index) => (
            <div key={index} className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer ${getGridColSpan(image.aspectRatio)}`} onClick={() => setSelectedImage(index)}>
              <div className={`relative w-full h-full overflow-hidden bg-gray-100 ${getAspectClass(image.aspectRatio)}`}>
                <picture>
                  <source srcSet={image.src.replace('.jpg', '.webp')} type="image/webp" />
                  <img src={image.src} alt={image.alt} width={image.aspectRatio === 'portrait' ? 400 : image.aspectRatio === 'landscape' ? 600 : 500} height={image.aspectRatio === 'portrait' ? 600 : image.aspectRatio === 'landscape' ? 400 : 500} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0" />
                </picture>
                <div className="absolute inset-0 bg-primary-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                    <ZoomIn size={20} />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                  <p className="text-primary font-bold text-sm">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage !== null && (
        <div className="fixed inset-0 z-[60] bg-primary-dark/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors p-2" aria-label={content.close || 'Close'}>
              <X size={32} />
            </button>
            <div className="relative w-full h-auto rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <picture>
                <source srcSet={content.images[selectedImage].src.replace('.jpg', '.webp')} type="image/webp" />
                <img src={content.images[selectedImage].src} alt={content.images[selectedImage].alt} width={800} height={600} decoding="async" className="w-full max-h-[80vh] object-contain bg-black" />
              </picture>
            </div>
            <div className="mt-6 w-full flex items-center justify-between text-white">
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage - 1 + content.images.length) % content.images.length); }} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-serif font-bold">{content.images[selectedImage].alt}</h3>
                <p className="text-sm text-gray-300 mt-1">{selectedImage + 1} {content.imageCounter || 'of'} {content.images.length}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage + 1) % content.images.length); }} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
