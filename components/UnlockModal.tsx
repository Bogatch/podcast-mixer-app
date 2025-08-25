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
  initialTab?: 'buy' | 'enter' | 'recover';
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
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');

  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const codeIsValid = useMemo(() => /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{2,3}$/.test(code), [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/-/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 9);
    const chunks = raw.match(/.{1,3}/g) || [];
    setCode(chunks.join('-'));
    if (codeError) setCodeError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo('');
    setError('');
    setEmailError('');
    setCodeError('');

    let invalid = false;
    if (!emailIsValid) {
      setEmailError(t('validation_email_invalid') || 'Please enter a valid email.');
      invalid = true;
    }
    if (!codeIsValid) {
      setCodeError(t('validation_code_invalid') || 'Enter code like ABC-123-DEF.');
      invalid = true;
    }
    if (invalid) return;

    const result = await verifyLicense(email, code);
    if (result.success) {
      setInfo(result.info || 'License verified. PRO unlocked.');
    } else {
      setError(result.error || t('error_invalid_license') || 'Invalid code or email.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <FieldLabel htmlFor="email_activate">{t('auth_email') || 'Your email'}</FieldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            id="email_activate"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            placeholder="your.email@example.com"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-700 bg-gray-900/70 py-2 pl-10 pr-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
            disabled={isLoading}
          />
        </div>
        {!!emailError && <TextHelp tone="error">{emailError}</TextHelp>}
      </div>

      <div>
        <FieldLabel htmlFor="license_key">{t('auth_license_key') || 'License key'}</FieldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <KeyIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            id="license_key"
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="ABC-123-DEF"
            className="w-full rounded-lg border border-gray-700 bg-gray-900/70 py-2 pl-10 pr-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            maxLength={11}
            required
            disabled={isLoading}
          />
        </div>
        {!!codeError && <TextHelp tone="error">{codeError}</TextHelp>}
      </div>

      {!!info && <TextHelp tone="success">{info}</TextHelp>}
      {!!error && <TextHelp tone="error">{error}</TextHelp>}

      <PrimaryButton type="submit" disabled={isLoading || !emailIsValid || !codeIsValid}>
        {isLoading ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            <span>{t('verifying') || 'Verifying…'}</span>
          </>
        ) : (
          <>
            <CheckIcon className="h-5 w-5" />
            <span>{t('verify_and_activate') || 'Verify & Activate'}</span>
          </>
        )}
      </PrimaryButton>
    </form>
  );
};

const RecoverForm: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { verifyLicense, isLoading } = usePro();
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const emailIsValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo('');
    setError('');
    if (!emailIsValid) {
      setError(t('validation_email_invalid') || 'Please enter a valid email.');
      return;
    }
    // recovery = prázdny kód -> server/Make pošle kľúč na email
    const result = await verifyLicense(email, '');
    if (result.success) {
      setInfo(result.info || 'Email bol úspešne odoslaný.');
    } else {
      setError(result.error || 'Nepodarilo sa odoslať email.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="email_recover">{t('auth_email') || 'Your email'}</FieldLabel>
        <Badge>{t('instant') || 'Instant'}</Badge>
      </div>
      <input
        id="email_recover"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your.email@example.com"
        autoComplete="email"
        className="w-full rounded-lg border border-gray-700 bg-gray-900/70 py-2 px-4 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        required
        disabled={isLoading}
      />

      {!!info && <TextHelp tone="success">{info}</TextHelp>}
      {!!error && <TextHelp tone="error">{error}</TextHelp>}

      <PrimaryButton type="submit" disabled={isLoading || !emailIsValid}>
        {isLoading ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            <span>{t('sending') || 'Sending…'}</span>
          </>
        ) : (
          <>
            <EnvelopeIcon className="h-5 w-5" />
            <span>{t('recover_send_button') || 'Send my key'}</span>
          </>
        )}
      </PrimaryButton>

      <p className="text-center text-xs text-gray-400">
        {t('recover_note') || 'We will email your existing license key if we can match your address.'}
      </p>
    </form>
  );
};

/* ---------- Main modal ---------- */

export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose, initialTab = 'buy' }) => {
  const { t } = useContext(I18nContext);
  const { isPro } = usePro();
  const [activeTab, setActiveTab] = useState<'buy' | 'enter' | 'recover'>(initialTab);

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
              <TabButton isActive={activeTab === 'recover'} onClick={() => setActiveTab('recover')}>
                <span className="inline-flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  {t('unlock_recover_key_tab') || 'Recover key'}
                </span>
              </TabButton>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              {activeTab === 'buy' && <BuyLicenseForm />}
              {activeTab === 'enter' && <ActivationForm />}
              {activeTab === 'recover' && <RecoverForm />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};