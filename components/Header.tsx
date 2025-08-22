import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
    MicIcon, QuestionMarkCircleIcon, ChevronDownIcon, SparklesIcon, SaveIcon, SpinnerIcon,
    UKFlagIcon, SlovakiaFlagIcon, GermanFlagIcon, FrenchFlagIcon, HungarianFlagIcon, PolishFlagIcon, SpanishFlagIcon, ItalianFlagIcon,
    CheckIcon, KeyIcon
} from './icons';
import { I18nContext, Locale } from '../lib/i18n';
import { usePro } from '../context/ProContext';


interface HeaderProps {
    onOpenHelp: () => void;
    onOpenUnlockModal: () => void;
    onSaveSession: () => void;
    isSavingSession: boolean;
    hasTracks: boolean;
}

const LanguageOption: React.FC<{
  locale: Locale,
  label: string,
  icon: React.ReactNode,
  onClick: () => void
}> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
    role="menuitem"
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const ProHeaderControls: React.FC<{onOpenUnlockModal: () => void}> = ({ onOpenUnlockModal }) => {
    const { t } = useContext(I18nContext);
    const { logout, isPro } = usePro();

    const DownloadButton: React.FC<{ label: string }> = ({ label }) => (
        <button
          disabled // Disabled for now as per user request
          title={t('tooltip_coming_soon')}
          className="px-3 py-2 bg-gray-700/80 text-sm font-medium text-gray-300 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed hidden sm:block"
        >
          {label}
        </button>
    );

    if (!isPro) {
      return (
         <button
            onClick={onOpenUnlockModal}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md transition-colors whitespace-nowrap"
        >
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm">{t('header_get_pro')}</span>
        </button>
      )
    }

    return (
        <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-500/20 text-green-300 font-semibold rounded-md whitespace-nowrap">
              <CheckIcon className="w-5 h-5" />
              <span className="text-sm">{t('header_pro_version')}</span>
            </div>
            <DownloadButton label={t('download_mac')} />
            <DownloadButton label={t('download_win')} />
            <button
              onClick={logout}
              title={t('header_deactivate')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
            >
              <KeyIcon className="w-5 h-5 text-red-400" />
            </button>
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ onOpenHelp, onOpenUnlockModal, onSaveSession, isSavingSession, hasTracks }) => {
  const { t, setLocale, locale } = useContext(I18nContext);
  const { isPro } = usePro();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageOptions: Record<Locale, { label: string, icon: React.ReactNode }> = {
    sk: { label: t('slovak'), icon: <SlovakiaFlagIcon className="w-6 h-auto rounded-sm" /> },
    en: { label: t('english'), icon: <UKFlagIcon className="w-6 h-auto rounded-sm" /> },
    de: { label: t('german'), icon: <GermanFlagIcon className="w-6 h-auto rounded-sm" /> },
    fr: { label: t('french'), icon: <FrenchFlagIcon className="w-6 h-auto rounded-sm" /> },
    hu: { label: t('hungarian'), icon: <HungarianFlagIcon className="w-6 h-auto rounded-sm" /> },
    pl: { label: t('polish'), icon: <PolishFlagIcon className="w-6 h-auto rounded-sm" /> },
    es: { label: t('spanish'), icon: <SpanishFlagIcon className="w-6 h-auto rounded-sm" /> },
    it: { label: t('italian'), icon: <ItalianFlagIcon className="w-6 h-auto rounded-sm" /> },
  };

  const handleLangSelect = (selectedLocale: Locale) => {
    setLocale(selectedLocale);
    setIsLangOpen(false);
  }

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
      <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              title={t('language')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
            >
              {languageOptions[locale].icon}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-20 border border-gray-600"
                role="menu"
              >
                {(Object.keys(languageOptions) as Locale[]).map((lang) => (
                  <LanguageOption
                    key={lang}
                    locale={lang}
                    label={languageOptions[lang].label}
                    icon={languageOptions[lang].icon}
                    onClick={() => handleLangSelect(lang)}
                  />
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={onOpenHelp}
            title={t('header_help')}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
          >
             <QuestionMarkCircleIcon className="w-5 h-5"/>
             <span className="hidden sm:inline">{t('help_title')}</span>
          </button>
          
          {hasTracks && (
            <button
              onClick={onSaveSession}
              disabled={isSavingSession}
              title={t('save_session')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 disabled:bg-gray-600 text-sm font-medium text-white rounded-md transition-colors"
            >
              {isSavingSession ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
              <span className="hidden sm:inline">{isSavingSession ? t('saving') : t('save_session')}</span>
            </button>
          )}

          <ProHeaderControls onOpenUnlockModal={onOpenUnlockModal} />

      </div>
    </header>
  );
};