// components/UnlockModal.tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { I18nContext } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../context/ProContext';
import {
  XMarkIcon,
  SparklesIcon,
  EnvelopeIcon,
  CreditCardIcon,
  SpinnerIcon,
  CheckIcon,
  KeyIcon,
} from './icons';

interface UnlockModalProps {
  onClose: () => void;
  initialTab?: 'buy' | 'enter';
}

/* ---------- Small UI atoms ---------- */

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
    {children}
  </span>
);

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-gray-200">
    {children}
  </label>
);

const TextHelp: React.FC<{ tone?: 'error' | 'success' | 'muted'; children: React.ReactNode }> = ({ tone = 'muted', children }) => {
  const base = 'text-xs mt-1 text-center';
  const toneCls =
    tone === 'error' ? 'text-red-400' : tone === 'success' ? 'text-green-400' : 'text-gray-400';
  return <p className={`${base} ${toneCls}`}>{children}</p>;
};

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-800/50 ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 font-semibold text-black shadow-md transition-colors hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-yellow-700/50 ${className}`}
  >
    {children}
  </button>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({
  isActive,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`group relative flex-1 px-4 py-3 text-sm font-semibold outline-none transition-colors
      ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
  >
    <span
      className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full transition
      ${isActive ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]' : 'bg-transparent group-hover:bg-gray-600'}`}
    />
    {children}
  </button>
);

/* ---------- Feature list (left column) ---------- */

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckIcon className="mt-0.5 h-5 w-5 flex-none text-green-400" />
    <p className="text-sm text-gray-300">{children}</p>
  </li>
);

/* ---------- Forms (right column) ---------- */

const BuyLicenseForm: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { createCheckout } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailIsValid) return;
    setLoading(true);
    setError('');

    const result = await createCheckout(email);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // pri úspechu presmeruje Stripe; spinner necháme bežať do navigácie
  };

  return (
    <form onSubmit={handlePurchase} className="space-y-4">
      <div>
        <FieldLabel htmlFor="email_purchase">{t('auth_email') || 'Your email'}</FieldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            id="email_purchase"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-700 bg-gray-900/70 py-2 pl-10 pr-4 text-white placeholder-gray-500 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {!!error && <TextHelp tone="error">{error}</TextHelp>}

      <SecondaryButton type="submit" disabled={isLoading || !emailIsValid}>
        {isLoading ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            <span>{t('unlock_modal_creating_checkout') || 'Creating checkout…'}</span>
          </>
        ) : (
          <>
            <CreditCardIcon className="h-5 w-5" />
            <span>{t('purchase_modal_buy_license') || 'Buy license'}</span>
          </>
        )}
      </SecondaryButton>

      <p className="text-center text-xs text-gray-400">
        {t('purchase_form_subtitle') || 'You’ll be redirected to our secure payment page.'}
      </p>
    </form>
  );
};

const ActivationForm: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { verifyLicense, isLoading } = usePro();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);

  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const codeIsValid = useMemo(
    () => /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{2,3}$/.test(code),
    [code]
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setInfo('');
    const value = e.target.value;
    const raw = value.replace(/-/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 9);
    const parts = [];
    for (let i = 0; i < raw.length; i += 3) parts.push(raw.substring(i, i + 3));
    setCode(parts.join('-'));
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!emailIsValid) {
      setError(t('validation_email_invalid'));
      return;
    }
    if (!codeIsValid) {
      setError(t('validation_code_invalid'));
      return;
    }

    const r = await verifyLicense(email, code);
    if (!r.success) setError(r.error || t('error_invalid_license'));
  };

  const doRecover = async () => {
    setError('');
    setInfo('');
    if (!emailIsValid) {
      setError(t('validation_email_invalid'));
      return;
    }
    setRecoverLoading(true);
    const r = await verifyLicense(email, ''); // prázdny kód = RECOVER
    setRecoverLoading(false);
    if (r.success) {
      setInfo(
        t('recover_info') ||
          'If this email is registered, we have sent your license key to your inbox.'
      );
      // necháme code prázdne, aby sa dalo hneď vložiť po doručení mailu
      setCode('');
    } else {
      setError(
        r.error ||
          t('recover_error') ||
          'We could not send the key to this email.'
      );
    }
  };

  return (
    <form onSubmit={handleActivation} className="space-y-4">
      {/* Email */}
      <div>
        <label
          htmlFor="email_activate"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {t('auth_email')}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email_activate"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setInfo('');
            }}
            placeholder="your.email@example.com"
            className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || recoverLoading}
          />
        </div>
      </div>

      {/* License key */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="license_key"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {t('auth_license_key')}
          </label>

          {/* jemný odkaz na obnovu (vrátený) */}
          <button
            type="button"
            onClick={doRecover}
            disabled={!emailIsValid || isLoading || recoverLoading}
            className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50 disabled:no-underline"
            title={t('recover_send_title') || 'Send my license key to email'}
          >
            {t('recover_send_link') || 'Forgot your key? Send it to my email'}
          </button>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <KeyIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="license_key"
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="ABC-123-DEF"
            className="w-full bg-gray-900/70 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={11}
            // POZOR: už NIE je required, aby recover mohol fungovať samostatne
            disabled={isLoading || recoverLoading}
          />
        </div>

        {/* sekundárne veľké tlačidlo pre recover (necháme aj link vyššie) */}
        <div className="mt-2">
          <button
            type="button"
            onClick={doRecover}
            disabled={!emailIsValid || isLoading || recoverLoading}
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
          >
            {recoverLoading ? (
              <>
                <SpinnerIcon className="w-5 h-5 mr-3 animate-spin" />
                {t('recover_sending') || 'Sending…'}
              </>
            ) : (
              <>
                <EnvelopeIcon className="w-5 h-5 mr-3" />
                {t('recover_send_button') || 'Send my license key'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info / Error */}
      {info && <p className="text-green-400 text-sm text-center">{info}</p>}
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {/* Verify button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || recoverLoading || !emailIsValid || !codeIsValid}
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

      {/* pomocný text pod formulárom */}
      <p className="text-xs text-center text-emerald-400">
        {t('recover_hint') ||
          'If we find a match, we will email your existing license key.'}
      </p>
    </form>
  );
};


/* ---------- Main modal ---------- */

export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose, initialTab = 'buy' }) => {
  const { t } = useContext(I18nContext);
  const { isPro } = usePro();
  const [activeTab, setActiveTab] = useState<'buy' | 'enter'>(initialTab);

  // Auto-close po úspešnej aktivácii (UX)
  useEffect(() => {
    if (isPro) {
      const id = setTimeout(onClose, 2000);
      return () => clearTimeout(id);
    }
  }, [isPro, onClose]);

  // ESC na zavretie
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-green-500/30 bg-gray-800 shadow-2xl">
          <div className="space-y-4 p-8 text-center">
            <CheckIcon className="mx-auto h-16 w-16 animate-pulse text-green-400" />
            <h2 className="text-2xl font-bold text-white">{t('activation_success_title')}</h2>
            <p className="text-gray-400">{t('activation_success_message')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="unlock-modal-title"
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(17,24,39,0.9))] shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-7 w-7 text-yellow-400" />
            <div>
              <h2 id="unlock-modal-title" className="text-xl font-bold text-white">
                {t('unlock_modal_title') || 'Unlock PRO features'}
              </h2>
              <p className="text-sm text-gray-400">
                {t('unlock_modal_subtitle') || 'Buy a license or activate an existing one.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
            title={t('close') || 'Close'}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Body */}
        <main className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          {/* Left: highlights */}
          <section className="order-2 md:order-1">
            <div className="mb-4 flex items-center gap-2">
              <Badge>{t('best_value') || 'Best value'}</Badge>
              <span className="text-xs text-gray-400">{t('lifetime_license') || 'Lifetime license'}</span>
            </div>

            <ul className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
              <Feature>{t('unlock_feature_1') || 'Unlimited high-quality exports'}</Feature>
              <Feature>{t('unlock_feature_2') || 'No watermarks, no limits'}</Feature>
              <Feature>{t('unlock_feature_3') || 'Priority updates & support'}</Feature>
              <Feature>{t('unlock_feature_4') || 'Commercial use included'}</Feature>
            </ul>

            <p className="mt-4 text-xs text-gray-500">
              {t('security_note') || 'Secure payment • Cancel anytime before completing checkout'}
            </p>
          </section>

          {/* Right: tabs + forms */}
          <section className="order-1 md:order-2">
            <div className="mb-4 flex rounded-lg border border-white/10 bg-white/5 p-1">
              <TabButton isActive={activeTab === 'buy'} onClick={() => setActiveTab('buy')}>
                <span className="inline-flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  {t('unlock_buy_license_tab') || 'Buy'}
                </span>
              </TabButton>
              <TabButton isActive={activeTab === 'enter'} onClick={() => setActiveTab('enter')}>
                <span className="inline-flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  {t('unlock_enter_key_tab') || 'Enter key'}
                </span>
              </TabButton>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              {activeTab === 'buy' && <BuyLicenseForm />}
              {activeTab === 'enter' && <ActivationForm />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};