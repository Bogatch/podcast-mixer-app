import React, { useState, useContext } from 'react';
import { useLicense } from '../context/LicenseContext';
import { I18nContext } from '../lib/i18n';
import { XMarkIcon, KeyIcon, CheckIcon, SpinnerIcon, UserIcon } from './icons';

interface LicenseKeyModalProps {
  onClose: () => void;
}

export const LicenseKeyModal: React.FC<LicenseKeyModalProps> = ({ onClose }) => {
  const { t } = useContext(I18nContext);
  const { unlockWithKey } = useLicense();
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleUnlock = async () => {
    setError(null);
    if (!key.trim() || !isValidEmail(email)) {
        setError(t('license_error_invalid'));
        return;
    }

    setIsUnlocking(true);
    
    const result = await unlockWithKey(email, key);
    
    setIsUnlocking(false);
    
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
        if (result.error === 'already_used') {
            setError(t('license_error_already_used'));
        } else if (result.error === 'server_error') {
            setError(t('license_error_server'));
        } else {
            setError(t('license_error_invalid'));
        }
    }
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    try {
      const response = await fetch('/api/create-checkout-session', { 
        method: 'POST',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse the error message from the server for better debugging
        const errorData = await response.json().catch(() => ({}));
        const serverMessage = errorData?.error?.message || 'Server responded with an error';
        console.error('Payment initiation failed. Server message:', serverMessage);
        throw new Error(serverMessage); // Throw with server message for context
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError(t('error_request_timeout'));
      } else {
        // We still show a generic message to the end-user for security.
        // The detailed error is in the developer console.
        setError(t('license_purchase_error'));
      }
      setIsPurchasing(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 flex items-start justify-between border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{t('license_title')}</h2>
            <p className="text-sm text-gray-400 mt-1">{isSuccess ? t('license_success_subtitle') : t('license_purchase_title')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            title={t('close')}
            disabled={isSuccess}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6">
          {isSuccess ? (
             <div className="text-center p-8 bg-green-500/10 rounded-lg">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500">
                    <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-green-300">{t('license_success_title')}</h3>
                <p className="mt-2 text-sm text-gray-400">{t('license_success_subtitle')}</p>
            </div>
          ) : (
            <>
                <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || isUnlocking}
                    className="w-full flex justify-center items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-wait text-lg shadow-lg"
                >
                    {isPurchasing ? <SpinnerIcon className="animate-spin h-6 w-6" /> : t('license_purchase_button')}
                </button>
                
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm font-semibold">{t('license_or')}</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-300 text-center">{t('license_have_key_title')}</h3>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                      {t('license_email_label')}
                    </label>
                     <div className="mt-1 relative rounded-md shadow-sm">
                       <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                       </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="block w-full rounded-md border-gray-600 bg-gray-900/50 pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isUnlocking || isPurchasing}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="license-key" className="block text-sm font-medium text-gray-300">
                      {t('license_key_label')}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                       <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                       </div>
                      <input
                        type="text"
                        name="license-key"
                        id="license-key"
                        className="block w-full rounded-md border-gray-600 bg-gray-900/50 pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-teal-500 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isUnlocking || isPurchasing}
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                </div>
            </>
          )}
        </main>
        
        {!isSuccess && (
          <footer className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-xl flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isUnlocking || isPurchasing || !key.trim() || !email.trim() || !isValidEmail(email)}
              className="w-32 flex justify-center items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isUnlocking ? (
                <SpinnerIcon className="animate-spin h-5 w-5" />
              ) : (
                t('license_unlock_button')
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};