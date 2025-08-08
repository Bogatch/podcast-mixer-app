import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';

interface LicenseState {
  status: 'trial' | 'premium';
  exportsRemaining: number;
}

type UnlockResult = {
  success: boolean;
  error?: 'invalid_key' | 'already_used' | 'server_error';
}

interface LicenseContextType extends LicenseState {
  unlockWithKey: (email: string, key: string) => Promise<UnlockResult>;
  useExport: () => boolean;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const defaultState: LicenseState = {
  status: 'trial',
  exportsRemaining: 5,
};

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<LicenseState>(() => {
    try {
      const item = window.localStorage.getItem('licenseState');
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed.status === 'premium' || (parsed.status === 'trial' && typeof parsed.exportsRemaining === 'number')) {
          return parsed;
        }
      }
    } catch (error) {
        console.error("Failed to parse license state from localStorage", error);
    }
    return defaultState;
  });

  useEffect(() => {
    try {
        window.localStorage.setItem('licenseState', JSON.stringify(license));
    } catch (error) {
        console.error("Failed to save license state to localStorage", error);
    }
  }, [license]);

  const unlockWithKey = useCallback(async (email: string, key: string): Promise<UnlockResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch('/api/verify-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, key }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (response.ok && data.success) {
            setLicense({ status: 'premium', exportsRemaining: Infinity });
            return { success: true };
        } else {
            return { success: false, error: data.error || 'invalid_key' };
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Activation request failed:", error);
        return { success: false, error: 'server_error' };
    }
  }, []);

  const useExport = useCallback((): boolean => {
    if (license.status === 'premium') {
      return true;
    }
    if (license.exportsRemaining > 0) {
      setLicense(l => ({ ...l, exportsRemaining: l.exportsRemaining - 1 }));
      return true;
    }
    return false;
  }, [license]);

  const value = { ...license, unlockWithKey, useExport };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextType => {
    const context = useContext(LicenseContext);
    if (context === undefined) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};