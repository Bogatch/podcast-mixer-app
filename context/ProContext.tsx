import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

interface ProUser {
  email: string;
  key: string;
}

interface VerifyResult {
  success: boolean;
  error?: string;
  info?: string;
}

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proUser: ProUser | null;
  verifyLicense: (email: string, code: string) => Promise<VerifyResult>;
  logout: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proUser, setProUser] = useState<ProUser | null>(null);

  useEffect(() => {
    try {
      const savedLicense = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLicense) {
        const licenseData = JSON.parse(savedLicense);
        if (licenseData?.isPro && licenseData?.email && licenseData?.key) {
          setIsPro(true);
          setProUser({ email: licenseData.email, key: licenseData.key });
        }
      }
    } catch (e) {
      console.error('Failed to load license from localStorage', e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(
    async (email: string, code: string): Promise<VerifyResult> => {
      setIsLoading(true);
      const apiUrl = '/api/verify-license';

      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });

        // načítaj text; môže to byť JSON alebo obyčajný text
        const text = await resp.text();

        // skús parse JSON
        let payload: any = null;
        try {
          payload = JSON.parse(text);
        } catch {
          // non-JSON odpoveď
          if (!resp.ok) {
            return {
              success: false,
              error: 'Došlo k chybe pri komunikácii so serverom. Skúste to znova neskôr.',
            };
          }
          // 200 bez JSONu – berieme ako úspešné odoslanie mailu (napr. pri recovery flow)
          return { success: true, info: 'Email bol úspešne odoslaný.' };
        }

        // normalizácia polí
        const success = Boolean(payload?.success ?? payload?.ok === true);
        const message: string = String(payload?.message || '');

        if (resp.ok && success) {
          // deteguj „odoslaný e-mail“ vs. „overená licencia“
          const looksLikeMailSent =
            /sent/i.test(message) || (/email/i.test(message) && !code);

          if (looksLikeMailSent) {
            return { success: true, info: 'Email bol úspešne odoslaný.' };
          }

          // úspešná verifikácia → odomkni PRO lokálne
          const licenseData = {
            isPro: true,
            email: email.trim(),
            key: code.trim(),
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
          setIsPro(true);
          setProUser({ email: licenseData.email, key: licenseData.key });

          return { success: true, info: 'Licencia overená. PRO odomknuté.' };
        }

        // neúspech (4xx/5xx alebo success:false)
        const lowered = message.toLowerCase();
        if (
          resp.status === 400 ||
          lowered.includes('not found') ||
          lowered.includes('no registration') ||
          lowered.includes('invalid')
        ) {
          return {
            success: false,
            error:
              'Nenašli sme registráciu pre zadaný e-mail. Skontrolujte, prosím, adresu.',
          };
        }

        return {
          success: false,
          error: 'Došlo k chybe pri spracovaní. Skúste to znova neskôr.',
        };
      } catch (e) {
        console.error('Failed to call verification API:', e);
        return {
          success: false,
          error: 'Nepodarilo sa pripojiť k serveru. Skúste to neskôr.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsPro(false);
    setProUser(null);
  }, []);

  const value: ProContextType = {
    isPro,
    isLoading,
    proUser,
    verifyLicense,
    logout,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
};

export const usePro = (): ProContextType => {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
};