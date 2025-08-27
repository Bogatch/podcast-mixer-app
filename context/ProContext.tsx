// context/ProContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

interface ProUser {
  email: string;
  key: string;
  activationsLeft?: number;
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

  // Simplified, robust function to get a finite integer from any value.
  const getActivationsValue = (value: any): number | undefined => {
    if (value === null || typeof value === 'undefined') {
      return undefined;
    }
    const num = parseInt(String(value), 10);
    return Number.isFinite(num) ? num : undefined;
  };

  useEffect(() => {
    try {
      const savedLicense = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLicense) {
        const licenseData = JSON.parse(savedLicense);
        if (licenseData.isPro && licenseData.email && licenseData.key) {
          setIsPro(true);
          setProUser({
            email: licenseData.email,
            key: licenseData.key,
            activationsLeft: getActivationsValue(licenseData.activationsLeft),
          });
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(
    async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/verify-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });

        let data: any = null;
        const text = await response.text();
        try { data = JSON.parse(text); } catch { /* no-op */ }

        if (response.ok) {
          if (data?.success || data?.status === 'success') {
            const activations = getActivationsValue(data.activations_left);

            const licenseData: ProUser & { isPro: boolean } = { 
              isPro: true, 
              email: email.trim(), 
              key: code.trim(),
              activationsLeft: activations,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
            setIsPro(true);
            setProUser(licenseData);
            return { success: true };
          }
          return {
            success: false,
            error: data?.message || 'We could not verify your license. Please try again.',
          };
        }

        if (data && typeof data === 'object') {
          return {
            success: false,
            error: data.message || 'License verification failed. Please try again later.',
          };
        }
        return {
          success: false,
          error: 'Could not reach the license server. Please try again later.',
        };
      } catch (err) {
        console.error('verifyLicense error:', err);
        return { success: false, error: 'Network error. Please try again.' };
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

  const value: ProContextType = { isPro, isLoading, proUser, verifyLicense, logout };
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
};

export const usePro = (): ProContextType => {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used within a ProProvider');
  return ctx;
};