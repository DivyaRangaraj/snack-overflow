import type { Category, StockStatus } from '../types';

export function getStockStatus(quantity: number, lowStockThreshold: number): StockStatus {
  if (quantity === 0) return 'GONE';
  if (quantity <= lowStockThreshold) return 'RUNNING_LOW';
  return 'STOCKED';
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'STOCKED': return 'In Stock';
    case 'RUNNING_LOW': return 'Running Low';
    case 'GONE': return 'Out of Stock';
  }
}

export function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'SWEET': return 'Sweet';
    case 'SAVOURY': return 'Savoury';
    case 'DRINK': return 'Drink';
    case 'HEALTHY_ISH': return 'Healthy-ish';
  }
}

export function getCategoryEmoji(category: Category): string {
  switch (category) {
    case 'SWEET': return '🍬';
    case 'SAVOURY': return '🥨';
    case 'DRINK': return '🥤';
    case 'HEALTHY_ISH': return '🥗';
  }
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
