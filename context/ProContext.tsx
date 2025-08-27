// context/ProContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

interface ProUser {
  email: string;
  key: string;
  activationsLeft?: number | null;
}

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proUser: ProUser | null;
  verifyLicense: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proUser, setProUser] = useState<ProUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isPro && parsed?.email && parsed?.key) {
          setIsPro(true);
          setProUser({
            email: parsed.email,
            key: parsed.key,
            activationsLeft: typeof parsed.activationsLeft === 'number' ? parsed.activationsLeft : null,
          });
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* upstream might return non-JSON */ }

      if (res.ok && (data.success === true || data.ok === true || data.status === 'success')) {
        const left =
          typeof data.activations_left === 'number' ? data.activations_left
        : typeof data.remaining === 'number'       ? data.remaining
        : typeof data.activationsLeft === 'number' ? data.activationsLeft
        : null;

        const licenseData = { isPro: true, email: email.trim(), key: code.trim(), activationsLeft: left };

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
        setIsPro(true);
        setProUser({ email: licenseData.email, key: licenseData.key, activationsLeft: left });

        return { success: true };
      }

      const err =
        data?.message ||
        data?.error ||
        'Could not verify the license key.';
      return { success: false, error: err };
    } catch (e) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

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