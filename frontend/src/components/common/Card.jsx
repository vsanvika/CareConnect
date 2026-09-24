import React from 'react';

export const Card = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`glass-panel rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xl transition-all duration-300 ${
        hover ? 'hover:border-slate-300 hover:shadow-2xl hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
