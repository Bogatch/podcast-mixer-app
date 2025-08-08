import React, { useContext } from 'react';
import { MusicNoteIcon } from './icons';
import { I18nContext } from '../lib/i18n';

export const EmptyState: React.FC = () => {
  const { t } = useContext(I18nContext);
  return (
    <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-gray-600 rounded-lg">
      <MusicNoteIcon className="w-12 h-12 text-gray-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-300">{t('empty_title')}</h3>
      <p className="mt-1 text-sm text-gray-500">{t('empty_subtitle')}</p>
    </div>
  );
};