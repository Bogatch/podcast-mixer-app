import React from 'react';
import { XMarkIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g., 'max-w-2xl'
}

export const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children, footer, maxWidth = 'max-w-[520px]' }) => {
  const { t } = React.useContext(I18nContext);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`w-full ${maxWidth} rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[95vh]`}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <header className="flex-shrink-0 p-4 sm:p-5 flex items-center justify-between border-b border-slate-700">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"
            title={t('close')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="px-4 sm:px-5 py-4 sm:py-5 overflow-y-auto">
            {children}
        </main>
        {footer && (
            <footer className="flex-shrink-0 p-4 sm:p-5 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl">
                {footer}
            </footer>
        )}
      </div>
    </div>
  );
};
