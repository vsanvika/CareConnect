import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-sky-100 text-sky-800 border-sky-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    purple: 'bg-violet-100 text-violet-800 border-violet-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span role="status" className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide font-bold border ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  );
};
