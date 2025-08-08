import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
    MicIcon, QuestionMarkCircleIcon, ChevronDownIcon, KeyIcon, FolderPlusIcon,
    UKFlagIcon, SlovakiaFlagIcon, GermanFlagIcon, FrenchFlagIcon, HungarianFlagIcon, PolishFlagIcon, SpanishFlagIcon, ItalianFlagIcon
} from './icons';
import { I18nContext, Locale } from '../lib/i18n';
import { useLicense } from '../context/LicenseContext';


interface HeaderProps {
    onOpenHelp: () => void;
    onUnlock: () => void;
    onNewProject: () => void;
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

export const Header: React.FC<HeaderProps> = ({ onOpenHelp, onUnlock, onNewProject }) => {
  const { t, setLocale, locale } = useContext(I18nContext);
  const { status } = useLicense();
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
    <header className="flex items-center justify-between">
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
        {status === 'trial' && (
            <button
                onClick={onUnlock}
                title={t('license_unlock_header_button')}
                className="flex items-center space-x-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-sm font-medium text-white rounded-md transition-colors"
            >
                <KeyIcon className="w-5 h-5"/>
                <span className="hidden sm:inline">{t('unlock')}</span>
            </button>
        )}
        <button 
          onClick={onNewProject}
          title={t('header_new_project')}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-700/80 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-md transition-colors"
        >
           <FolderPlusIcon className="w-5 h-5"/>
           <span className="hidden sm:inline">{t('header_new_project')}</span>
        </button>
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
              aria-orientation="vertical"
              aria-labelledby="lang-menu-button"
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
      </div>
    </header>
  );
};