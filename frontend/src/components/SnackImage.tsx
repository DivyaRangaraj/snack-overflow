import { useState } from 'react';
import type { Snack } from '../types';
import { getSnackVisual } from '../utils/snackVisuals';

interface SnackImageProps {
  snack: Pick<Snack, 'name' | 'category' | 'imageUrl'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fit?: 'contain' | 'cover';
}

export function SnackImage({ snack, className = '', size = 'md', fit = 'contain' }: SnackImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const visual = getSnackVisual(snack.name, snack.category);

  // If user has provided a custom image, try it; otherwise use the local authentic SVG
  const primarySrc = snack.imageUrl && !useFallback ? snack.imageUrl : visual.reliableImage;

  // In case external URL fails, fall back to the authentic local SVG
  const handleError = () => {
    if (!useFallback) {
      setUseFallback(true);
    }
  };

  if (size === 'sm') {
    return (
      <div className={`relative overflow-hidden bg-white flex items-center justify-center p-1 ${className}`}>
        <img
          src={primarySrc}
          alt={snack.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={handleError}
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-white to-slate-50/70 flex items-center justify-center p-3 select-none ${className}`}>
      <img
        src={primarySrc}
        alt={snack.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={handleError}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} filter drop-shadow-md transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );
}
