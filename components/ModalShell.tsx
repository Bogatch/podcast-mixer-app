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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-slate-900 rounded-2xl shadow-2xl w-full flex flex-col border border-slate-800 max-h-[90vh] ${maxWidth}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"
            title={t('close')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 sm:p-5 overflow-y-auto">
            {children}
        </main>
        {footer && (
            <footer className="p-4 sm:p-5 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl flex-shrink-0">
                {footer}
            </footer>
        )}
      </div>
    </div>
  );
};