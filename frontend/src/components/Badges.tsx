import type { StockStatus, Category } from '../types';
import { getStockStatusLabel, getCategoryLabel, getCategoryEmoji } from '../utils';

interface StockBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export function StockBadge({ status, size = 'md' }: StockBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  const colorMap: Record<StockStatus, string> = {
    STOCKED: 'bg-green-100 text-green-700 border-green-200',
    RUNNING_LOW: 'bg-orange-100 text-orange-700 border-orange-200',
    GONE: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses} ${colorMap[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {getStockStatusLabel(status)}
    </span>
  );
}

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const colorMap: Record<Category, string> = {
    SWEET: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    SAVOURY: 'bg-orange-100 text-orange-700 border-orange-200',
    DRINK: 'bg-blue-100 text-blue-700 border-blue-200',
    HEALTHY_ISH: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses} ${colorMap[category]}`}>
      <span>{getCategoryEmoji(category)}</span>
      {getCategoryLabel(category)}
    </span>
  );
}
