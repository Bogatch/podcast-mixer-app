import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
    MicIcon, SparklesIcon,
    UKFlagIcon, SlovakiaFlagIcon,
    CheckIcon, KeyIcon
} from './icons';
import { I18nContext, Locale } from '../lib/i18n';
import { usePro } from '../context/ProContext';


interface HeaderProps {
    onOpenUnlockModal: (initialTab?: 'buy' | 'enter') => void;
}

const ProHeaderControls: React.FC<{onOpenUnlockModal: (initialTab?: 'buy' | 'enter') => void}> = ({ onOpenUnlockModal }) => {
    const { t } = useContext(I18nContext);
    const { logout, isPro, proUser } = usePro();

    if (!isPro) {
      return (
         <div className="flex items-center space-x-2">
            <button
                onClick={() => onOpenUnlockModal('enter')}
                className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700/80 hover:bg-gray-700 rounded-md transition-colors"
            >
                {t('unlock_enter_key_tab')}
            </button>
            <button
                onClick={() => onOpenUnlockModal('buy')}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md transition-colors whitespace-nowrap"
            >
                <SparklesIcon className="w-5 h-5" />
                <span className="text-sm">{t('header_get_pro')}</span>
            </button>
         </div>
      )
    }

    return (
        <div className="flex items-center space-x-2 sm:space-x-3">
             <div className="text-right">
                <div className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-green-500/20 text-green-300 font-semibold rounded-md whitespace-nowrap">
                  <CheckIcon className="w-5 h-5" />
                  <span className="text-sm">{t('header_pro_version')}</span>
                </div>
                {proUser?.email && (
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[160px]" title={proUser.email}>
                        {proUser.email}
                    </p>
                )}
            </div>
            <button
              onClick={logout}
              title={t('header_deactivate')}
              className="flex items-center self-start space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
            >
              <KeyIcon className="w-5 h-5 text-red-400" />
            </button>
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ onOpenUnlockModal }) => {
  const { t, setLocale, locale } = useContext(I18nContext);

  return (
    <header className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-teal-500/10 rounded-lg">
           <MicIcon className="w-8 h-8 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">{t('header_title')}</h1>
          <p className="text-sm sm:text-base text-gray-400">{t('header_subtitle')}</p>
        </div>
      </div>
      <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-1 bg-gray-700/80 p-1 rounded-lg">
            <button
                onClick={() => setLocale('sk')}
                title={t('slovak')}
                className={`p-1.5 rounded-md transition-colors ${locale === 'sk' ? 'bg-gray-600' : 'opacity-60 hover:opacity-100 hover:bg-gray-700'}`}
            >
                <SlovakiaFlagIcon className="w-6 h-auto rounded-sm" />
            </button>
            <button
                onClick={() => setLocale('en')}
                title={t('english')}
                className={`p-1.5 rounded-md transition-colors ${locale === 'en' ? 'bg-gray-600' : 'opacity-60 hover:opacity-100 hover:bg-gray-700'}`}
            >
                <UKFlagIcon className="w-6 h-auto rounded-sm" />
            </button>
          </div>
          
          <ProHeaderControls onOpenUnlockModal={onOpenUnlockModal} />

      </div>
    </header>
  );
};