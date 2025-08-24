// context/ProContext.tsx
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
  key: string; // uložíme pôvodný licenčný kľúč tak, ako ho zadal používateľ
}

interface VerifyResult {
  success: boolean;
  error?: string;
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

  // Načítanie uloženého PRO stavu pri štarte
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.isPro && parsed?.email && parsed?.key) {
          setIsPro(true);
          setProUser({ email: parsed.email, key: parsed.key });
        }
      }
    } catch (e) {
      console.error('Failed to load license from localStorage', e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hlavná funkcia overenia licencie – volá náš backend proxy /api/verify-license
  const verifyLicense = useCallback(
    async (email: string, code: string): Promise<VerifyResult> => {
      setIsLoading(true);

      const cleanedEmail = email.trim();
      const cleanedCode = code.trim(); // NEMENÍME veľkosť písmen – verifikácia je case-sensitive

      try {
        const res = await fetch('/api/verify-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Dôležité: posielame "code" (nie "key")
          body: JSON.stringify({ email: cleanedEmail, code: cleanedCode }),
        });

        // Odpoveď nášho servera je vždy JSON (aj pri chybách),
        // lebo backend wrapuje ne-JSON odpovede z Make.
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          return { success: false, error: 'INVALID_SERVER_RESPONSE' };
        }

        // Úspech ak: ok === true ALEBO status === "success"
        const success = data?.ok === true || data?.status === 'success';

        if (res.ok && success) {
          const toStore = {
            isPro: true,
            email: cleanedEmail,
            key: cleanedCode,
          };

          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toStore));
          } catch (e) {
            console.warn('Could not persist license to localStorage', e);
          }

          setIsPro(true);
          setProUser({ email: cleanedEmail, key: cleanedCode });
          return { success: true };
        }

        // Neúspech – vyber čo najlepšiu správu
        const message =
          data?.message ||
          data?.error ||
          (res.status === 401
            ? 'Invalid email or license key.'
            : 'VERIFICATION_FAILED');

        return { success: false, error: message };
      } catch (err: any) {
        console.error('verifyLicense network error:', err);
        return { success: false, error: 'NETWORK_ERROR' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage remove failed', e);
    }
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
  const ctx = useContext(ProContext);
  if (!ctx) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return ctx;
};
