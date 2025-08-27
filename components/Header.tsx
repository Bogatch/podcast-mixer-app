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
            <button
                onClick={() => onOpenUnlockModal('buy')}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md transition-colors whitespace-nowrap"
            >
                <SparklesIcon className="w-5 h-5" />
                <span className="text-sm">{t('header_get_pro')}</span>
            </button>
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
                {typeof proUser?.activationsLeft === 'number' && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('header_activations_left', { count: proUser.activationsLeft })}
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
  const { isPro } = usePro();

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex-shrink-0 p-2 sm:p-3 bg-teal-500/10 rounded-lg">
           <MicIcon className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-100 text-balance">{t('header_title')}</h1>
          <p className="text-sm sm:text-base text-gray-400">{t('header_subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-800/70 backdrop-blur p-1 rounded-xl">
              <button
                  onClick={() => setLocale('sk')}
                  title={t('slovak')}
                  className={`h-8 w-10 flex items-center justify-center rounded-lg transition-colors ${locale === 'sk' ? 'bg-slate-600' : 'opacity-70 hover:opacity-100 hover:bg-slate-700'}`}
              >
                  <SlovakiaFlagIcon className="w-6 h-auto rounded-sm" />
              </button>
              <button
                  onClick={() => setLocale('en')}
                  title={t('english')}
                  className={`h-8 w-10 flex items-center justify-center rounded-lg transition-colors ${locale === 'en' ? 'bg-slate-600' : 'opacity-70 hover:opacity-100 hover:bg-slate-700'}`}
              >
                  <UKFlagIcon className="w-6 h-auto rounded-sm" />
              </button>
            </div>
            {!isPro && (
               <button
                  onClick={() => onOpenUnlockModal('enter')}
                  className="h-9 px-3 text-sm font-semibold text-gray-300 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
              >
                  {t('unlock_enter_key_tab')}
              </button>
            )}
          </div>
          
          <ProHeaderControls onOpenUnlockModal={onOpenUnlockModal} />

      </div>
    </header>
  );
};