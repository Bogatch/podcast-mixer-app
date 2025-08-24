import React, { useContext, useState, useMemo } from 'react';
import { EnvelopeIcon, KeyIcon, SpinnerIcon, CheckIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { usePro } from '../context/ProContext';

export const LicenseVerification: React.FC = () => {
    const { t } = useContext(I18nContext);
    const { verifyLicense, isLoading } = usePro();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    
    const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
    const codeIsValid = useMemo(() => /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{2,3}$/.test(code), [code]);

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
        // On success, the ProContext will update the state and this component will unmount.
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-1">{t('unlock_form_title')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('unlock_form_subtitle')}</p>

            <form onSubmit={handleActivation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email_activate_main" className="sr-only">{t('auth_email')}</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email_activate_main"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder={t('auth_email')}
                                className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                    </div>
                    <div>
                        <label htmlFor="license_key_main" className="sr-only">{t('auth_license_key')}</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <KeyIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="license_key_main"
                                type="text"
                                value={code}
                                onChange={handleCodeChange}
                                placeholder={t('auth_license_key')}
                                className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading}
                                maxLength={11}
                            />
                        </div>
                        {codeError && <p className="text-red-400 text-xs mt-1">{codeError}</p>}
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !emailIsValid || !codeIsValid}
                        className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700/50 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors shadow-lg hover:shadow-blue-500/20"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 mr-3 animate-spin" />
                                <span>{t('verifying')}</span>
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-5 h-5 mr-3" />
                                <span>{t('verify_and_activate')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
