// context/ProContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { I18nContext } from '../lib/i18n'; // aby sme mali t()

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proUser: { email: string; key: string } | null;
  verifyLicense: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useContext(I18nContext);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proUser, setProUser] = useState<{ email: string; key: string } | null>(null);

  useEffect(() => {
    try {
      const savedLicense = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLicense) {
        const licenseData = JSON.parse(savedLicense);
        if (licenseData.isPro && licenseData.email && licenseData.key) {
          setIsPro(true);
          setProUser({ email: licenseData.email, key: licenseData.key });
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const localizeError = useCallback((errorCode?: string, fallbackMsg?: string) => {
    switch (errorCode) {
      case 'KEY_NOT_FOUND':
        return t('error_key_not_found');
      case 'EMAIL_AND_CODE_REQUIRED':
        return t('error_email_code_required');
      case 'INVALID_JSON':
        return t('error_invalid_json');
      case 'METHOD_NOT_ALLOWED':
        return t('error_method_not_allowed');
      case 'NON_JSON_UPSTREAM':
        return t('error_upstream_nonjson');
      case 'UPSTREAM_ERROR':
        return t('error_upstream_generic');
      case 'SERVER_MISCONFIGURED':
        return t('error_server_misconfigured');
      case 'RATE_LIMITED':
        return t('error_rate_limited');
      default:
        return fallbackMsg || t('error_generic');
    }
  }, [t]);

  const verifyLicense = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const apiUrl = '/api/verify-license';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (response.ok && (data?.ok === true || data?.success === true)) {
        const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
        setIsPro(true);
        setProUser({ email: email.trim(), key: code.trim() });
        return { success: true };
      }

      // non-200 alebo success:false
      const msg = localizeError(data?.errorCode, data?.message);
      // doplníme hint na support
      const withHint = `${msg} ${t('error_support_hint')}`;
      return { success: false, error: withHint };

    } catch {
      return { success: false, error: `${t('error_network')} ${t('error_support_hint')}` };
    } finally {
      setIsLoading(false);
    }
  }, [localizeError, t]);

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsPro(false);
    setProUser(null);
  }, []);

  const value: ProContextType = { isPro, isLoading, proUser, verifyLicense, logout };
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
};

export const usePro = (): ProContextType => {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
};