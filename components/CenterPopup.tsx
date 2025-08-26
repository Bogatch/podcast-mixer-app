import React, { useEffect, useContext } from 'react';
import { I18nContext } from '../lib/i18n';

interface CenterPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  autoCloseMs?: number; // 0 = nevypínať automaticky
}

const CenterPopup: React.FC<CenterPopupProps> = ({
  open,
  onClose,
  title,
  message,
  icon,
  autoCloseMs = 0,
}) => {
  const { t } = useContext(I18nContext);

  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const id = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(id);
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1220] shadow-2xl ring-1 ring-black/5 overflow-hidden"
        style={{ animation: 'fadeIn .2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-white text-xl md:text-2xl font-semibold tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-md p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-gray-200 text-base md:text-lg leading-relaxed">
          {message}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-3 transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterPopup;
