import React from 'react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  loading = false
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20',
    accent: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300',
    outline: 'border border-sky-600/40 text-sky-700 hover:bg-sky-50',
    ghost: 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" aria-hidden="true" /> : Icon && <Icon className="w-4 h-4" />}
      <span>{loading ? 'Working...' : children}</span>
    </button>
  );
};
