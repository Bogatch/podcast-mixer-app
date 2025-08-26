import React, { useEffect } from 'react';

interface CenterPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  autoCloseMs?: number; // napr. 4000
}

export const CenterPopup: React.FC<CenterPopupProps> = ({
  open,
  onClose,
  title,
  message,
  icon,
  autoCloseMs = 0,
}) => {
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const id = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(id);
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1220] shadow-2xl ring-1 ring-black/5 overflow-hidden"
        style={{ animation: 'fadeIn .2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-white text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4 text-gray-200 text-sm">
          {message}
        </div>

        {/* footer */}
        <div className="px-5 pb-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterPopup;
