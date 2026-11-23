import { useState } from 'react';
import type { Snack } from '../types';
import { Package } from 'lucide-react';

interface SnackImageProps {
  snack: Pick<Snack, 'name' | 'category' | 'imageUrl'>;
  className?: string;
}

const categoryFallbacks: Record<string, string> = {
  SWEET: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=70',
  SAVOURY: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=70',
  DRINK: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=70',
  HEALTHY_ISH: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=70',
};

export function SnackImage({ snack, className = '' }: SnackImageProps) {
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const src = !error && snack.imageUrl ? snack.imageUrl : categoryFallbacks[snack.category];

  if (fallbackError) {
    return (
      <div className={`bg-soft-yellow flex items-center justify-center ${className}`}>
        <Package size={32} className="text-primary/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={snack.name}
      className={`object-cover ${className}`}
      onError={() => {
        if (!error) {
          setError(true);
        } else {
          setFallbackError(true);
        }
      }}
    />
  );
}
