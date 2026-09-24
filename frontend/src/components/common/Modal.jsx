import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-xl border border-slate-700/80 shadow-2xl p-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 id="modal-title" className="text-xl font-bold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
