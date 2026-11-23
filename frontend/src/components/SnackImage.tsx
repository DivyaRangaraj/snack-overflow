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
  const [imgError, setImgError] = useState(false);
  const visual = getSnackVisual(snack.name, snack.category);

  // Preferred source is the local authentic SVG
  const src = !imgError && snack.imageUrl ? snack.imageUrl : visual.reliableImage;

  if (imgError) {
    // Beautiful stylized packshot fallback if any asset fails
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${visual.gradient} flex flex-col items-center justify-center p-3 select-none text-white ${className}`}
      >
        <span className={size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'}>
          {visual.emoji}
        </span>
        {size !== 'sm' && (
          <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-center line-clamp-1 opacity-90">
            {snack.name}
          </span>
        )}
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className={`relative overflow-hidden bg-white flex items-center justify-center p-1 ${className}`}>
        <img
          src={src}
          alt={snack.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-white to-slate-50/70 flex items-center justify-center p-3 select-none ${className}`}>
      <img
        src={src}
        alt={snack.name}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} filter drop-shadow-md transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );
}
