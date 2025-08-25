// components/ThankYouModal.tsx
import React, { useContext } from 'react';
import { I18nContext } from '../lib/i18n';
import { XMarkIcon, CheckIcon, EnvelopeIcon } from './icons';

export interface ThankYouModalProps {
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ onClose }) => {
  const { t } = useContext(I18nContext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-green-400/30 bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{t('thankyou_title')}</h3>
          <button className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 text-center">
          <CheckIcon className="mx-auto h-14 w-14 text-green-400" />
          <h4 className="text-xl font-bold text-white">{t('thankyou_message_title')}</h4>
          <p className="text-gray-300">{t('thankyou_message_subtitle')}</p>

          <div className="mt-2 inline-flex items-center rounded-md bg-gray-900/60 px-4 py-3">
            <EnvelopeIcon className="mr-2 h-5 w-5 text-gray-300" />
            <span className="text-sm text-gray-200">{t('thankyou_message_check_email')}</span>
          </div>

          <button
            onClick={onClose}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-blue-700"
          >
            {t('thankyou_button_ok')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouModal;
