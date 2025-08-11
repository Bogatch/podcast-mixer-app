import React, { useContext, useState } from 'react';
import { XMarkIcon, SparklesIcon, EnvelopeIcon, KeyIcon, CreditCardIcon, SpinnerIcon, CheckIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start">
        <div className="flex-shrink-0">
            <CheckIcon className="w-6 h-6 text-green-400" />
        </div>
        <p className="ml-3 text-lg text-gray-300">{children}</p>
    </li>
);

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { t } = useContext(I18nContext);
    const { user, signIn, signUp, createCheckout } = useAuth();
    
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        const action = authMode === 'login' ? signIn : signUp;
        const { error } = await action(email, password);

        setIsLoading(false);
        if (error) {
            setError(error.message);
        } else if (authMode === 'signup') {
            setMessage(t('auth_check_email_detailed'));
            setEmail('');
            setPassword('');
        } else {
            onClose(); // Close on successful login
        }
    };

    const handleBuyLicense = async () => {
        if (isCreatingCheckout) return;

        if (!user) {
            setError(t('auth_must_be_logged_in'));
            setAuthMode('login');
            return;
        }
        
        setError('');
        setIsCreatingCheckout(true);
        
        try {
            await createCheckout();
            // The context handles redirection, so we don't need to do anything here.
            // If it fails, an error will be set in the context, but we can set a local one too.
        } catch (err: any) {
            setError(t(err.message || 'unlock_modal_checkout_failed'));
        } finally {
            setIsCreatingCheckout(false);
        }
    };
    
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
                        {t(user ? 'unlock_modal_title' : 'auth_login_title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        title={t('close')}
                        disabled={isLoading || isCreatingCheckout}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 overflow-y-auto">
                    {/* Left Column: Features */}
                    <div className="space-y-6">
                        <p className="text-lg text-gray-400">{t('unlock_modal_subtitle')}</p>
                        <div className="bg-gray-900/50 p-6 rounded-lg">
                            <ul className="space-y-4">
                                <Feature>{t('unlock_feature_1')}</Feature>
                                <Feature>{t('unlock_feature_2')}</Feature>
                                <Feature>{t('unlock_feature_3')}</Feature>
                                <Feature>{t('unlock_feature_4')}</Feature>
                            </ul>
                        </div>
                         <button
                            onClick={handleBuyLicense}
                            disabled={isCreatingCheckout || !user}
                            className="w-full flex items-center justify-center px-6 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-md transition-colors shadow-lg hover:shadow-yellow-500/20"
                        >
                             {isCreatingCheckout ? (
                                <>
                                    <SpinnerIcon className="w-6 h-6 mr-3 animate-spin" />
                                    <span>{t('unlock_modal_creating_checkout')}</span>
                                </>
                            ) : (
                                <>
                                    <CreditCardIcon className="w-6 h-6 mr-3" />
                                    <span>{t('unlock_modal_buy_license')}</span>
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Right Column: Auth Form */}
                    <div className="flex flex-col space-y-6">
                       <div className="flex justify-center border border-gray-700 rounded-lg p-1 bg-gray-900/50">
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${authMode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                            >
                                {t('log_in')}
                            </button>
                            <button
                                onClick={() => setAuthMode('signup')}
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${authMode === 'signup' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                            >
                                {t('sign_up')}
                            </button>
                        </div>

                        <form onSubmit={handleAuthAction} className="space-y-4">
                            <div>
                               <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">{t('auth_email')}</label>
                               <div className="relative">
                                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                       <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                   </div>
                                   <input
                                       id="email"
                                       type="email"
                                       value={email}
                                       onChange={(e) => setEmail(e.target.value)}
                                       placeholder="your.email@example.com"
                                       className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       required
                                       disabled={isLoading || isCreatingCheckout}
                                   />
                               </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">{t('auth_password')}</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                       <KeyIcon className="h-5 w-5 text-gray-400" />
                                   </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base font-mono text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        minLength={6}
                                        disabled={isLoading || isCreatingCheckout}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            {message && <p className="text-green-400 text-sm text-center">{message}</p>}

                            <div className="pt-2">
                               <button
                                    type="submit"
                                    disabled={isLoading || isCreatingCheckout || !email || !password}
                                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-wait"
                                >
                                    {isLoading ? (
                                        <>
                                            <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                                            <span>{authMode === 'login' ? t('auth_logging_in') : t('auth_signing_up')}</span>
                                        </>
                                    ) : (
                                        <span>{authMode === 'login' ? t('log_in') : t('sign_up')}</span>
                                    )}
                               </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};