import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ value = 0, onChange, size = 'sm', showValue = false }) => {
  const interactive = typeof onChange === 'function';
  const iconClass = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => onChange(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
        >
          <Star className={`${iconClass} ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} transition-colors`} />
        </button>
      ))}
      {showValue && <span className="text-xs text-slate-400 ml-1">{Number(value || 0).toFixed(1)}</span>}
    </div>
  );
};
