// context/ProContext.tsx
import React, {
  createContext, useContext, useState, useEffect, ReactNode, useCallback
} from 'react';

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
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proUser, setProUser] = useState<{ email: string; key: string } | null>(null);

  // Načítať PRO z localStorage po mount-e
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj?.isPro && obj?.email && obj?.key) {
          setIsPro(true);
          setProUser({ email: obj.email, key: obj.key });
        }
      }
    } catch (e) {
      console.error('Failed to load license from localStorage', e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    const apiUrl = '/api/verify-license';

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ posielaj "code", nie "key"
        body: JSON.stringify({ email, code })
      });

      const text = await resp.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { success: false, error: 'NON_JSON', raw: text }; }

      console.log('[verifyLicense] HTTP', resp.status, 'payload:', data);

      if (resp.ok && data?.success === true) {
        const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
        setIsPro(true);
        setProUser({ email: email.trim(), key: code.trim() });
        return { success: true };
      } else {
        return { success: false, error: data?.message || data?.error || 'Invalid email or license key.' };
      }
    } catch (e) {
      console.error('Failed to call verification API:', e);
      return { success: false, error: 'Could not connect to the license server.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsPro(false);
    setProUser(null);
  }, []);

  return (
    <ProContext.Provider value={{ isPro, isLoading, proUser, verifyLicense, logout }}>
      {children}
    </ProContext.Provider>
  );
};

export const usePro = (): ProContextType => {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
};