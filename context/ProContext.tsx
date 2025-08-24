import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
    } catch (e) {
      console.error("Failed to load license from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyLicense = useCallback(async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const apiUrl = '/api/verify-license'; // Point to our backend proxy

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, key: code }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const licenseData = { isPro: true, email: email.trim(), key: code.trim() };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(licenseData));
          setIsPro(true);
          setProUser({ email: email.trim(), key: code.trim() });
          return { success: true };
        } else {
          // This case might happen if server returns 200 OK but success: false
          return { success: false, error: data.error || "An unknown verification error occurred." };
        }
      } else {
        // Handle non-200 responses (4xx, 5xx)
        const errorText = await response.text();
        try {
          // Try to parse as JSON, which our API should return
          const errorData = JSON.parse(errorText);
          return { success: false, error: errorData.error || "Invalid email or license key." };
        } catch (e) {
          // If it's not JSON (e.g., HTML error page from Vercel), return a generic error.
          // This prevents the dreaded SyntaxError crash.
          console.error("Received non-JSON error response from server:", errorText);
          return { success: false, error: "Could not connect to the license server." };
        }
      }
    } catch (error) {
      console.error("Failed to call verification API:", error);
      return { success: false, error: "Could not connect to the license server." };
    } finally {
      setIsLoading(false);
    }
  }, []);


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
