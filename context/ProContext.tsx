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
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });

        const data = await response.json().catch(() => null);

        // Handle network errors or non-JSON responses
        if (!data) {
          return { success: false, error: 'Could not connect to the license server.' };
        }

        // Handle successful API responses
        if (response.ok && data.success) {
          // If it was a successful activation (not recovery), update the state
          if (!isRecovery) {
            const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
            setIsPro(true);
            setProUser(licenseData);
          }
          // For both successful activation and recovery, return the info message from the server.
          // The new API endpoint ensures a message is always provided on success.
          return { success: true, info: data.message };
        } 
        
        // Handle unsuccessful API responses (e.g., wrong key, server error)
        return { success: false, error: data.message || 'An unknown error occurred.' };

      } catch (error) {
        console.error('Failed to call verification API:', error);
        return { success: false, error: 'Could not connect to the license server.' };
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