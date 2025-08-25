import React, { useContext, useState, useMemo, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, EnvelopeIcon, CreditCardIcon, SpinnerIcon, CheckIcon, KeyIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { usePro } from '../context/ProContext';

interface UnlockModalProps {
  onClose: () => void;
  initialTab?: 'buy' | 'enter';
}

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start">
        <div className="flex-shrink-0">
            <CheckIcon className="w-5 h-5 text-green-400" />
        </div>
        <p className="ml-3 text-base text-gray-300">{children}</p>
    </li>
);

const BuyLicenseForm: React.FC = () => {
    const { t } = useContext(I18nContext);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

    const handlePurchase = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailIsValid) return;

        setIsLoading(true);
        setError('');
        
        const stripeUrl = `https://buy.stripe.com/bJe14ogcG5bi9QR47g?prefilled_email=${encodeURIComponent(email)}`;
        window.location.href = stripeUrl;
    };
    
    return (
        <form onSubmit={handlePurchase} className="space-y-4">
            <div>
               <label htmlFor="email_purchase" className="block text-sm font-medium text-gray-300 mb-2">{t('auth_email')}</label>
               <div className="relative">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                       <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                       id="email_purchase"
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="your.email@example.com"
                       className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       required
                       disabled={isLoading}
                   />
               </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="pt-2">
               <button
                    type="submit"
                    disabled={isLoading || !emailIsValid}
                    className="w-full flex items-center justify-center px-6 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-md transition-colors shadow-lg hover:shadow-yellow-500/20"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="w-6 h-6 mr-3 animate-spin" />
                            <span>{t('unlock_modal_creating_checkout')}</span>
                        </>
                    ) : (
                        <>
                            <CreditCardIcon className="w-6 h-6 mr-3" />
                            <span>{t('purchase_modal_buy_license')}</span>
                        </>
                    )}
               </button>
            </div>
        </form>
    );
};

const ActivationForm: React.FC = () => {
    const { t } = useContext(I18nContext);
    const { verifyLicense, isLoading } = usePro();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    
    const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
    const codeIsValid = useMemo(
      () => /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}$/.test(code),
      [code]
    );

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const rawValue = value.replace(/-/g, '').replace(/[^A-Za-z0-9]/g, '').substring(0, 9);
        const parts = [];
        for (let i = 0; i < rawValue.length; i += 3) {
            parts.push(rawValue.substring(i, i + 3));
        }
        const formattedValue = parts.join('-');
        setCode(formattedValue);
        if (codeError) setCodeError('');
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) setEmailError('');
    }

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setEmailError('');
        setCodeError('');

        let hasClientError = false;
        if (!emailIsValid) {
            setEmailError(t('validation_email_invalid'));
            hasClientError = true;
        }
        if (!codeIsValid) {
            setCodeError(t('validation_code_invalid'));
            hasClientError = true;
        }
        if (hasClientError) return;

        const result = await verifyLicense(email, code);
        if (!result.success) {
            setError(result.error || t('error_invalid_license'));
        }
    };

    return (
        <form onSubmit={handleActivation} className="space-y-4">
            <div>
                <label htmlFor="email_activate" className="block text-sm font-medium text-gray-300 mb-2">{t('auth_email')}</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
                    <input id="email_activate" type="email" value={email} onChange={handleEmailChange} placeholder="your.email@example.com" className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={isLoading}/>
                </div>
                {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>
            <div>
                <label htmlFor="license_key" className="block text-sm font-medium text-gray-300 mb-2">{t('auth_license_key')}</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><KeyIcon className="h-5 w-5 text-gray-400" /></div>
                    <input id="license_key" type="text" value={code} onChange={handleCodeChange} placeholder="ABC-123-DEF" className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={isLoading} maxLength={11}/>
                </div>
                {codeError && <p className="text-red-400 text-xs mt-1">{codeError}</p>}
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="pt-2">
                <button type="submit" disabled={isLoading || !emailIsValid || !codeIsValid} className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700/50 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors shadow-lg hover:shadow-blue-500/20">
                    {isLoading ? (<><SpinnerIcon className="w-5 h-5 mr-3 animate-spin" /><span>{t('verifying')}</span></>) : (<><CheckIcon className="w-5 h-5 mr-3" /><span>{t('verify_and_activate')}</span></>)}
                </button>
            </div>
        </form>
    );
};

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
            isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);


export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose, initialTab = 'buy' }) => {
    const { t } = useContext(I18nContext);
    const { isPro } = usePro();
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (isPro) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isPro, onClose]);
    
    if (isPro) {
      return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-green-500/30">
                  <div className="p-8 text-center space-y-4">
                      <CheckIcon className="w-16 h-16 text-green-400 mx-auto animate-pulse" />
                      <h2 className="text-2xl font-bold text-white">{t('activation_success_title')}</h2>
                      <p className="text-gray-400">{t('activation_success_message')}</p>
                  </div>
              </div>
          </div>
      );
    }
    
    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-yellow-500/30"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex items-center justify-between border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <SparklesIcon className="w-8 h-8 mr-3 text-yellow-400" />
                        {t('unlock_modal_title')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title={t('close')}>
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 overflow-y-auto">
                    {/* Left Column: Features */}
                    <div className="space-y-6">
                        <p className="text-lg text-gray-400">{t('unlock_modal_subtitle')}</p>
                        <div className="bg-gray-900/50 p-6 rounded-lg">
                            <ul className="space-y-3">
                                <Feature>{t('unlock_feature_1')}</Feature>
                                <Feature>{t('unlock_feature_2')}</Feature>
                                <Feature>{t('unlock_feature_3')}</Feature>
                                <Feature>{t('unlock_feature_4')}</Feature>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Right Column: Purchase Form */}
                    <div className="flex flex-col justify-center space-y-6 bg-gray-800/50 p-6 rounded-lg">
                        <div className="flex border-b border-gray-700">
                            <TabButton isActive={activeTab === 'buy'} onClick={() => setActiveTab('buy')}>
                                <CreditCardIcon className="w-5 h-5 mr-2" />
                                <span>{t('unlock_buy_license_tab')}</span>
                            </TabButton>
                             <TabButton isActive={activeTab === 'enter'} onClick={() => setActiveTab('enter')}>
                                <KeyIcon className="w-5 h-5 mr-2" />
                                <span>{t('unlock_enter_key_tab')}</span>
                            </TabButton>
                        </div>
                        
                        {activeTab === 'buy' ? (
                            <div>
                                <div className='text-center mb-6'>
                                    <h3 className="text-xl font-semibold text-gray-200">{t('unlock_buy_license_tab')}</h3>
                                    <p className="text-sm text-gray-400 mt-2">{t('purchase_form_subtitle')}</p>
                                </div>
                                <BuyLicenseForm />
                            </div>
                        ) : (
                            <div>
                               <div className='text-center mb-6'>
                                    <h3 className="text-xl font-semibold text-gray-200">{t('unlock_form_title')}</h3>
                                    <p className="text-sm text-gray-400 mt-2">{t('unlock_form_subtitle')}</p>
                                </div>
                                <ActivationForm />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};