import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react';

interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  maxPreview?: number;
}

export function ImageGallery({ images, maxPreview = 4 }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const previewImages = images.slice(0, maxPreview);
  const remainingCount = images.length - maxPreview;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  };

  // Grid layout based on image count
  const getGridClass = () => {
    if (previewImages.length === 1) return 'grid-cols-1';
    if (previewImages.length === 2) return 'grid-cols-2';
    if (previewImages.length === 3) return 'grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-4';
  };

  return (
    <>
      {/* Image Grid */}
      <div className={`grid ${getGridClass()} gap-2 my-4`}>
        {previewImages.map((image, index) => (
          <motion.button
            key={image.id}
            onClick={() => openLightbox(index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative overflow-hidden rounded-xl bg-slate-100 group
              ${previewImages.length === 1 ? 'aspect-video' : 'aspect-square'}
            `}
          >
            <img
              src={image.url}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn
                size={24}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Show remaining count on last preview image */}
            {index === maxPreview - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">+{remainingCount}</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white
                         bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Download button */}
            <a
              href={images[lightboxIndex].url}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-16 p-2 text-white/70 hover:text-white
                         bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <Download size={24} />
            </a>

            {/* Navigation - Previous */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 p-3 text-white/70 hover:text-white
                           bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25 }}
              className="max-w-[90vw] max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt || `Image ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              {/* Caption */}
              {images[lightboxIndex].caption && (
                <p className="text-center text-white/80 text-sm mt-4">
                  {images[lightboxIndex].caption}
                </p>
              )}
            </motion.div>

            {/* Navigation - Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 p-3 text-white/70 hover:text-white
                           bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2
                            bg-white/10 rounded-full text-white/80 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
