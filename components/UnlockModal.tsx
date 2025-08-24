import React, { useContext, useState, useMemo } from 'react';
import { XMarkIcon, SparklesIcon, EnvelopeIcon, CreditCardIcon, SpinnerIcon, CheckIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface UnlockModalProps {
  onClose: () => void;
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
    const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

    const handlePurchase = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailIsValid) return;

        setIsLoading(true);
        const baseUrl = 'https://buy.stripe.com/bJe14ogcG5bi9QR47g00000';
        // Pre-fill email for Stripe payment link
        const finalUrl = `${baseUrl}?prefilled_email=${encodeURIComponent(email)}`;
        window.location.href = finalUrl;
        // The page will redirect, so no need to set isLoading back to false.
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


export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose }) => {
    const { t } = useContext(I18nContext);
    
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
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        title={t('close')}
                    >
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
                    <div className="flex flex-col justify-center space-y-6 bg-gray-800/50 p-8 rounded-lg">
                        <div className="pt-4">
                            <div className='text-center mb-6'>
                                <h3 className="text-xl font-semibold text-gray-200">
                                    {t('purchase_modal_buy_license')}
                                </h3>
                                <p className="text-sm text-gray-400 mt-2">
                                    {t('purchase_form_subtitle')}
                                </p>
                            </div>
                            <BuyLicenseForm />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};