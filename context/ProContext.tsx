// context/ProContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
      const isRecovery = !code?.trim();
      const apiUrl = '/api/verify-license';

      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });

        const text = await resp.text();
        let payload: any = {};
        try {
          payload = JSON.parse(text);
        } catch {
          // Fallback pre neočakávané non-JSON odpovede
          return { success: false, error: 'Komunikačná chyba so serverom.' };
        }
        
        const success = payload?.success === true;

        if (resp.ok && success) {
          if (!isRecovery) {
            // Úspešná aktivácia kľúča
            const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
            setIsPro(true);
            setProUser(licenseData);
          }
          // Pre recovery aj pre aktiváciu vraciame info správu
          return { success: true, info: payload.message || 'Operácia prebehla úspešne.' };
        }
        
        // Všetky ostatné prípady sú chyba
        return { success: false, error: payload.message || 'Neznáma chyba.' };

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