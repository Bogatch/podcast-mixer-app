import React from 'react';

export const Toast: React.FC<{
  tone?: 'success' | 'error' | 'info';
  title?: string;
  message?: string;
  onClose?: () => void;
}> = ({ tone = 'info', title, message, onClose }) => {
  const base = 'pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg';
  const toneCls =
    tone === 'success'
      ? 'border-green-500/30 bg-green-900/20'
      : tone === 'error'
      ? 'border-red-500/30 bg-red-900/20'
      : 'border-blue-500/30 bg-blue-900/20';

  const barCls =
    tone === 'success' ? 'bg-green-500' : tone === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`${base} ${toneCls}`}>
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-1 h-2 w-2 flex-none rounded-full ${barCls}`} />
        <div className="min-w-0 flex-1">
          {title && <p className="text-sm font-semibold text-white">{title}</p>}
          {message && <p className="mt-1 text-sm text-gray-200">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-300 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
