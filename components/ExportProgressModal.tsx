import React, { useContext } from 'react';
import { SpinnerIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface ExportProgressModalProps {
  progress: number;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({ progress }) => {
  const { t } = useContext(I18nContext);
  const roundedProgress = Math.round(progress);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 border border-gray-700 text-center space-y-6">
        <div className="flex items-center justify-center space-x-4">
            <SpinnerIcon className="w-8 h-8 text-blue-400 animate-spin" />
            <h2 className="text-2xl font-bold text-white">{t('export_progress_title')}</h2>
        </div>
        <p className="text-gray-400">{t('export_progress_message')}</p>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-width duration-150"
            style={{ width: `${roundedProgress}%` }}
          ></div>
        </div>
        <p className="text-xl font-mono font-semibold text-white">{roundedProgress}%</p>
      </div>
    </div>
  );
};
