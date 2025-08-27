// components/UnlockModal.tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { I18nContext, TranslationKey } from '../lib/i18n';
import { usePro } from '../context/ProContext';
import {
  CreditCardIcon,
  KeyIcon,
  EnvelopeIcon,
  SpinnerIcon,
} from './icons';
import { ModalShell } from './ModalShell';
import { TermsGate } from './TermsGate';

// ---------------------------------------------------------------------

type Tab = 'buy' | 'enter';

interface UnlockModalProps {
  onClose: () => void;
  initialTab?: Tab;
}

const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...rest }) => (
  <button
    {...rest}
    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 disabled:cursor-not-allowed shadow-lg transition ${className}`}
  >
    {children}
  </button>
);


// ========== VERIFY ==========
const VerifyForm: React.FC = () => {
  const { t } = useContext(I18nContext);
  const { verifyLicense, isLoading } = usePro();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const emailValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);
  const codeValid = useMemo(() => /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{2,3}$/.test(code), [code]);

  const onCodeChange = (v: string) => {
    setError('');
    const raw = v.replace(/-/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 9);
    const parts: string[] = [];
    for (let i = 0; i < raw.length; i += 3) parts.push(raw.substring(i, i + 3));
    setCode(parts.join('-'));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailValid || !codeValid) return;
    const r = await verifyLicense(email, code);
    if (!r.success) setError(r.error || t('error_invalid_license'));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="block text-sm text-gray-300 mb-2">{t('auth_email')}</span>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder={t('placeholder_email')}
            className="w-full rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white pl-10 pr-4 py-2.5"
            disabled={isLoading}
          />
        </div>
      </label>

      <label className="block">
        <span className="block text-sm text-gray-300 mb-2">{t('auth_license_key')}</span>
        <div className="relative">
          <KeyIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={e => onCodeChange(e.target.value)}
            placeholder={t('placeholder_license_key')}
            maxLength={11}
            className="w-full rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white pl-10 pr-4 py-2.5"
            disabled={isLoading}
          />
        </div>
      </label>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm leading-relaxed">
          {error}{' '}
          <a href="mailto:support@customradio.sk" className="underline decoration-dotted">
            support@customradio.sk
          </a>
        </div>
      )}

      <SecondaryButton type="submit" disabled={!emailValid || !codeValid || isLoading}>
        {isLoading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : <KeyIcon className="h-5 w-5" />}
        <span>{t('verify_and_activate')}</span>
      </SecondaryButton>
    </form>
  );
};

// ========== MODAL ==========
export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose, initialTab = 'buy' }) => {
  const { t, locale } = useContext(I18nContext);
  const { isPro } = usePro();
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (isPro) {
      const id = setTimeout(() => onClose(), 1600);
      return () => clearTimeout(id);
    }
  }, [isPro, onClose]);
  
  const featureTitleKey: TranslationKey = 'unlock_features_title';

  return (
    <ModalShell title={t('unlock_modal_title')} onClose={onClose} maxWidth="max-w-3xl">
      <div className="grid grid-cols-2 gap-2 bg-slate-800/70 p-1 rounded-xl">
          <button
            onClick={() => setTab('buy')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              tab === 'buy' ? 'bg-white/90 text-slate-900' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <CreditCardIcon className="h-4 w-4" />
            {t('unlock_buy_license_tab')}
          </button>
          <button
            onClick={() => setTab('enter')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              tab === 'enter' ? 'bg-white/90 text-slate-900' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <KeyIcon className="h-4 w-4" />
            {t('unlock_enter_key_tab')}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pt-6">
        <section className="md:col-span-2">
          <h3 className="text-white font-semibold mb-3">
            {t(featureTitleKey)}
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• {t('unlock_feature_1')}</li>
            <li>• {t('unlock_feature_2')}</li>
            <li>• {t('unlock_feature_3')}</li>
            <li>• {t('unlock_feature_4')}</li>
          </ul>
        </section>

        <section className="md:col-span-3">
          {tab === 'buy' ? <div className="-m-5"><TermsGate locale={locale === 'sk' ? 'sk' : 'en'} /></div> : <VerifyForm />}
        </section>
      </div>
    </ModalShell>
  );
};

export default UnlockModal;
