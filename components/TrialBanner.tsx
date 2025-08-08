import React, { useContext } from 'react';
import { I18nContext } from '../lib/i18n';
import { useLicense } from '../context/LicenseContext';
import { InformationCircleIcon, KeyIcon } from './icons';

interface TrialBannerProps {
  onUnlock: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onUnlock }) => {
  const { t } = useContext(I18nContext);
  const { exportsRemaining } = useLicense();

  if (exportsRemaining <= 0) {
    return (
      <div className="bg-red-900/50 border border-red-700/60 text-red-200 p-3 rounded-lg mb-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <InformationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-bold text-base">{t('license_error_no_exports')}</p>
          </div>
        </div>
        <button
          onClick={onUnlock}
          className="ml-4 flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors flex items-center space-x-2"
        >
          <KeyIcon className="w-5 h-5"/>
          <span>{t('unlock')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-yellow-800/40 border border-yellow-600/50 text-yellow-200 p-3 rounded-lg mb-6 flex items-center justify-between shadow-lg">
      <div className="flex items-center">
        <InformationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0 text-yellow-400" />
        <div>
          <p className="font-bold text-base">{t('license_trial_banner_text', { count: exportsRemaining })}</p>
        </div>
      </div>
      <button
        onClick={onUnlock}
        className="ml-4 flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors flex items-center space-x-2"
      >
        <KeyIcon className="w-5 h-5"/>
        <span className="hidden sm:inline">{t('license_unlock_header_button')}</span>
      </button>
    </div>
  );
};
