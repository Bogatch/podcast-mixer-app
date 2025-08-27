// context/ProContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'podcastMixerProLicense';

type NumOrNull = number | null;

function toNumOrNull(v: any): NumOrNull {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface ProUser {
  email: string;
  key: string;
  activationsLeft: NumOrNull;
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
            activationsLeft: toNumOrNull(parsed.activationsLeft),
          });
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // endpoint už mapuje body.code || body.key, takže 'code' je OK
        body: JSON.stringify({ email, code }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {/* upstream mohol byť non-JSON */}

      const isOk = res.ok && (data.success === true || data.ok === true || data.status === 'success');

      if (isOk) {
        // ber, čo príde, a premeň na number
        const leftRaw =
          data.activations_left ??
          data.remaining ??
          data.remainingActivations ??
          data.activationsLeft;
        const left = toNumOrNull(leftRaw);

        const licenseData = {
          isPro: true,
          email: email.trim(),
          key: code.trim(),
          activationsLeft: left,
        };

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
        setIsPro(true);
        setProUser({
          email: licenseData.email,
          key: licenseData.key,
          activationsLeft: left,
        });

        return { success: true };
      }

      const err = data?.message || data?.error || 'Could not verify the license key.';
      return { success: false, error: err };
    } catch {
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