import { useState } from 'react';
import type { Snack } from '../types';
import { getSnackVisual } from '../utils/snackVisuals';

interface SnackImageProps {
  snack: Pick<Snack, 'name' | 'category' | 'imageUrl'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SnackImage({ snack, className = '', size = 'md' }: SnackImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const visual = getSnackVisual(snack.name, snack.category);
  const imageSrc = snack.imageUrl || visual.reliableImage;

  // Render the attractive food illustration banner
  const renderFallback = () => {
    // If small thumbnail (w-9 h-9 or similar)
    if (className.includes('w-9') || className.includes('w-8') || size === 'sm') {
      return (
        <div
          className={`w-full h-full bg-gradient-to-br ${visual.gradient} flex items-center justify-center select-none shadow-inner`}
        >
          <span className="text-lg leading-none transform transition-transform group-hover:scale-110">
            {visual.emoji}
          </span>
        </div>
      );
    }

    // Medium/Large Card presentation
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${visual.gradient} relative overflow-hidden flex flex-col items-center justify-center p-3 select-none text-white`}
      >
        {/* Decorative soft glow rings */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/20 blur-lg pointer-events-none" />

        {/* Centerpiece 3D Emoji Icon */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-5xl filter drop-shadow-md mb-2 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {visual.emoji}
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm text-white/90 border border-white/10 max-w-[90%] truncate">
            {visual.tag}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {/* If the image failed or hasn't loaded yet, show the attractive styled food card */}
      {(!imageLoaded || imageError) && (
        <div className="absolute inset-0 z-0">
          {renderFallback()}
        </div>
      )}

      {/* Real photo overlay with smooth fade-in */}
      {!imageError && imageSrc && (
        <img
          src={imageSrc}
          alt={snack.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
